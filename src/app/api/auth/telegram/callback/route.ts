import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramData, createSessionToken, COOKIE_NAME } from "@/lib/auth";

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID ?? "6371272028";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  if (!verifyTelegramData(params)) {
    return NextResponse.redirect(new URL("/login?denied=1", req.url));
  }

  const telegramId = params.id;
  const isAdmin = telegramId === ADMIN_TELEGRAM_ID;

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      username: params.username ?? null,
      firstName: params.first_name ?? null,
      lastName: params.last_name ?? null,
      photoUrl: params.photo_url ?? null,
      lastLoginAt: new Date(),
      ...(isAdmin ? { isAdmin: true, hasAccess: true } : {}),
    },
    create: {
      telegramId,
      username: params.username ?? null,
      firstName: params.first_name ?? null,
      lastName: params.last_name ?? null,
      photoUrl: params.photo_url ?? null,
      isAdmin,
      hasAccess: isAdmin,
      lastLoginAt: new Date(),
    },
  });

  if (!user.hasAccess) {
    return NextResponse.redirect(new URL("/login?denied=1", req.url));
  }

  const token = createSessionToken({
    telegramId: user.telegramId,
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    isAdmin: user.isAdmin,
    hasAccess: user.hasAccess,
  });

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
