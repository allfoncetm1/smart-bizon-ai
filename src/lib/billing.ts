// Логика подписки: создание счёта, зачёт оплаты, вычисление доступа для токена.
// Продление — ручное (клиент сам оплачивает новый счёт), автозакрытия доступа нет.

import type { AccessVia, PayMethod, PlanId, Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLANS, TRIAL_DAYS, getPlan } from "@/lib/plans";
import { createPhoneInvoice, createQrInvoice, normalizeKzPhone } from "@/lib/apipay";

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

/** accessVia + trialEndsAt для JWT (строчные значения, как ждёт middleware).
 *  Истёкший триал не «чиним» — middleware по этим полям уведёт на /billing. */
export function resolveAccess(sub: Subscription | null): {
  accessVia: "trial" | "paid" | "admin";
  trialEndsAt: number | null;
} {
  if (!sub) return { accessVia: "trial", trialEndsAt: 0 };
  if (sub.accessVia === "ADMIN") return { accessVia: "admin", trialEndsAt: null };
  if (sub.accessVia === "PAID") return { accessVia: "paid", trialEndsAt: null };
  return {
    accessVia: "trial",
    trialEndsAt: sub.trialEndsAt ? Math.floor(sub.trialEndsAt.getTime() / 1000) : 0,
  };
}

/** Активен ли триал прямо сейчас (по данным подписки). */
export function isTrialActive(sub: Subscription | null, now: Date = new Date()): boolean {
  return !!sub && sub.accessVia === "TRIAL" && !!sub.trialEndsAt && sub.trialEndsAt > now;
}

/** При входе: у обычного юзера без подписки заводим триал на TRIAL_DAYS дней. */
export async function ensureSubscription(userId: string, isAdmin: boolean): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) {
    // Админам, получившим доступ вручную до этой фичи, фиксируем ADMIN.
    if (isAdmin && existing.accessVia === "TRIAL") {
      return prisma.subscription.update({
        where: { userId },
        data: { accessVia: "ADMIN", status: "ACTIVE" },
      });
    }
    return existing;
  }
  return prisma.subscription.create({
    data: {
      userId,
      status: isAdmin ? "ACTIVE" : "TRIALING",
      accessVia: isAdmin ? "ADMIN" : "TRIAL",
      trialEndsAt: isAdmin ? null : addDays(new Date(), TRIAL_DAYS),
    },
  });
}

export interface CheckoutResult {
  paymentId: string;
  method: PayMethod;
  status: string;
  qrTokenUrl: string | null;
  qrImageUrl: string | null;
}

/** Создаёт счёт в ApiPay под текущего пользователя. */
export async function startCheckout(params: {
  userId: string;
  plan: PlanId;
  method: PayMethod;
  phone?: string;
}): Promise<CheckoutResult> {
  const plan = getPlan(params.plan);
  if (!plan) throw new Error("Неизвестный тариф");

  let phone: string | null = null;
  if (params.method === "PHONE") {
    phone = normalizeKzPhone(params.phone ?? "");
    if (!phone) throw new Error("Неверный номер телефона (нужен формат 8XXXXXXXXXX)");
  }

  const sub = await ensureSubscription(params.userId, false);

  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      subscriptionId: sub.id,
      plan: plan.id,
      method: params.method,
      amount: plan.amount,
      status: "PENDING",
    },
  });

  const description = `Smart Bizon AI — доступ (${plan.label})`;

  try {
    const invoice =
      params.method === "QR"
        ? await createQrInvoice({ amount: plan.amount, description, externalOrderId: payment.id })
        : await createPhoneInvoice({ amount: plan.amount, phone: phone!, description, externalOrderId: payment.id });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        apipayInvoiceId: invoice.invoiceId,
        qrTokenUrl: invoice.qrTokenUrl,
        qrImageUrl: invoice.qrImageUrl,
      },
    });
    if (phone) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { phone } });
    }

    return {
      paymentId: payment.id,
      method: params.method,
      status: invoice.status ?? "pending",
      qrTokenUrl: invoice.qrTokenUrl,
      qrImageUrl: invoice.qrImageUrl,
    };
  } catch (err) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "ERROR" } });
    throw err;
  }
}

interface ApiPayInvoiceFields {
  id?: number | string;
  status?: string;
  amount?: string;
  kaspi_invoice_id?: string | null;
  is_sandbox?: boolean;
  paid_at?: string | null;
}

/** Оплата пришла: продлеваем доступ. Идемпотентно — повторный вызов ничего не меняет. */
export async function applyPaidInvoice(paymentId: string, invoice: ApiPayInvoiceFields): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  });
  if (!payment || payment.status === "PAID") return;

  const plan = PLANS[payment.plan];
  const now = new Date();
  const base =
    payment.subscription.currentPeriodEnd && payment.subscription.currentPeriodEnd > now
      ? payment.subscription.currentPeriodEnd
      : now;
  const currentPeriodEnd = addDays(base, plan.days);
  const nextAccessVia: AccessVia = payment.subscription.accessVia === "ADMIN" ? "ADMIN" : "PAID";

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: invoice.paid_at ? new Date(invoice.paid_at) : now,
        apipayInvoiceId: invoice.id != null ? String(invoice.id) : payment.apipayInvoiceId,
        kaspiInvoiceId: invoice.kaspi_invoice_id ?? null,
        isSandbox: invoice.is_sandbox ?? false,
      },
    }),
    prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "ACTIVE", accessVia: nextAccessVia, plan: payment.plan, currentPeriodEnd },
    }),
    prisma.user.update({ where: { id: payment.userId }, data: { hasAccess: true } }),
  ]);
}

const NON_PAID: Record<string, "CANCELLED" | "EXPIRED" | "ERROR"> = {
  cancelled: "CANCELLED",
  expired: "EXPIRED",
  error: "ERROR",
};

/** Счёт не оплачен (отменён / просрочен / ошибка) — доступ не трогаем. */
export async function applyInvoiceStatus(paymentId: string, status: string): Promise<void> {
  const mapped = NON_PAID[status];
  if (!mapped) return;
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PENDING" },
    data: { status: mapped },
  });
}

/** Возврат средств. По требованию владельца доступ автоматически не закрываем. */
export async function applyRefund(paymentId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: "PAID" },
    data: { status: "REFUNDED" },
  });
}
