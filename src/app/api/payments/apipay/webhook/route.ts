import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/apipay";
import { applyInvoiceStatus, applyPaidInvoice, applyRefund } from "@/lib/billing";

// Нужен Node-runtime (crypto), не Edge. Ответ всегда динамический.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Вебхук ApiPay об изменении статуса счёта.
// URL в дашборде ApiPay: https://smartbizon.online/api/payments/apipay/webhook
//
// Подпись: заголовок X-Webhook-Signature = "sha256=" + HMAC-SHA256(сырое тело, секрет).
// Ответ обязателен в течение 5 сек. ApiPay повторяет доставку только при 5xx,
// 429 и сетевых ошибках; на 2xx/4xx повторов нет. Дедуп — по (invoice.id, status).

interface WebhookBody {
  event?: string;
  invoice?: {
    id?: number | string;
    external_order_id?: string | null;
    status?: string;
    amount?: string;
    kaspi_invoice_id?: string | null;
    is_sandbox?: boolean;
    paid_at?: string | null;
  };
  refund?: { id?: number | string; status?: string };
  subscription?: { id?: number | string };
  invoice_id?: number | string;
  timestamp?: string;
}

function dedupeKeyFor(body: WebhookBody): string {
  const { event } = body;
  if (event === "invoice.status_changed" && body.invoice)
    return `invoice:${body.invoice.id}:${body.invoice.status}`;
  if (event === "invoice.refunded" && body.refund)
    return `refund:${body.refund.id}:${body.refund.status}`;
  if (event === "invoice.qr_scanned" && body.invoice) return `qr_scanned:${body.invoice.id}`;
  if (event?.startsWith("subscription.") && body.subscription)
    return `${event}:${body.subscription.id}:${body.invoice_id ?? ""}`;
  return `${event ?? "unknown"}:${body.timestamp ?? Date.now()}`;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!verifyWebhookSignature(raw, req.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const dedupeKey = dedupeKeyFor(body);
  const seen = await prisma.webhookEvent.findUnique({ where: { dedupeKey } });
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  try {
    await handle(body);
  } catch (err) {
    // 5xx → ApiPay повторит доставку; обработчики идемпотентны.
    console.error("ApiPay webhook processing error:", err);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  await prisma.webhookEvent
    .create({ data: { event: body.event ?? "unknown", dedupeKey, payload: body as object } })
    .catch(() => {}); // гонка двух доставок — вторая вставка не критична

  return NextResponse.json({ ok: true });
}

async function handle(body: WebhookBody): Promise<void> {
  if (body.event === "invoice.status_changed" && body.invoice) {
    const inv = body.invoice;
    const payment = await findPayment(inv.external_order_id, inv.id);
    if (!payment) {
      console.warn("ApiPay webhook: платёж не найден", inv.external_order_id, inv.id);
      return;
    }
    if (inv.status === "paid") await applyPaidInvoice(payment.id, inv);
    else if (inv.status) await applyInvoiceStatus(payment.id, inv.status);
    return;
  }

  if (body.event === "invoice.refunded" && body.refund?.status === "completed" && body.invoice) {
    const payment = await findPayment(body.invoice.external_order_id, body.invoice.id);
    if (payment) await applyRefund(payment.id);
    return;
  }

  // invoice.qr_scanned, webhook.test, subscription.* и прочее — просто фиксируем в журнале.
}

async function findPayment(externalOrderId?: string | null, apipayInvoiceId?: number | string) {
  if (externalOrderId) {
    const byOrder = await prisma.payment.findUnique({ where: { id: externalOrderId } });
    if (byOrder) return byOrder;
  }
  if (apipayInvoiceId != null) {
    return prisma.payment.findUnique({ where: { apipayInvoiceId: String(apipayInvoiceId) } });
  }
  return null;
}
