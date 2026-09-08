import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Пользователи + их подписка + число платежей — для таблицы в /admin.
export async function GET() {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { payments: true } },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      photoUrl: u.photoUrl,
      isAdmin: u.isAdmin,
      hasAccess: u.hasAccess,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      paymentsCount: u._count.payments,
      subscription: u.subscription && {
        status: u.subscription.status,
        accessVia: u.subscription.accessVia,
        plan: u.subscription.plan,
        trialEndsAt: u.subscription.trialEndsAt,
        currentPeriodEnd: u.subscription.currentPeriodEnd,
        phone: u.subscription.phone,
      },
    })),
  );
}
