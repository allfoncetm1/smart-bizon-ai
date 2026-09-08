import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Состояние подписки для страницы /billing (поллинг после оплаты).
export async function GET() {
  const session = await getRawSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.userId } });
  const lastPayment = await prisma.payment.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    subscription: sub && {
      status: sub.status,
      accessVia: sub.accessVia,
      plan: sub.plan,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
    lastPayment: lastPayment && {
      id: lastPayment.id,
      status: lastPayment.status,
      method: lastPayment.method,
      plan: lastPayment.plan,
      amount: lastPayment.amount,
      qrTokenUrl: lastPayment.qrTokenUrl,
      qrImageUrl: lastPayment.qrImageUrl,
    },
  });
}
