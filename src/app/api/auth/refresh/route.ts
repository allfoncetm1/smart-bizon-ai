import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { resolveAccess } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Перевыпускает cookie сессии из актуальных данных БД. Нужен после оплаты,
// чтобы accessVia в 30-дневном токене сменился trial → paid без перелогина.
export async function GET() {
  const raw = await getRawSession();
  if (!raw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: raw.userId } });
  if (!user) {
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const access = resolveAccess(sub);

  const token = createSessionToken({
    userId: user.id,
    telegramId: user.telegramId,
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    isAdmin: user.isAdmin,
    hasAccess: user.hasAccess,
    accessVia: access.accessVia,
    trialEndsAt: access.trialEndsAt,
  });

  const res = NextResponse.json({
    hasAccess: user.hasAccess,
    isAdmin: user.isAdmin,
    accessVia: access.accessVia,
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
