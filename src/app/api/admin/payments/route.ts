import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Журнал платежей ApiPay (последние 100) для /admin.
export async function GET() {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { firstName: true, username: true, telegramId: true } } },
  });

  return NextResponse.json(
    payments.map((p) => ({
      id: p.id,
      user: p.user.firstName ?? p.user.username ?? p.user.telegramId,
      plan: p.plan,
      method: p.method,
      amount: p.amount,
      status: p.status,
      isSandbox: p.isSandbox,
      apipayInvoiceId: p.apipayInvoiceId,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
  );
}
