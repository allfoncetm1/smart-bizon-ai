import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession, VIEWAS_COOKIE } from "@/lib/auth";

// Uses the RAW (never-impersonated) session so an admin can switch directly
// from viewing one account to another without first clearing the cookie.
export async function POST(req: NextRequest) {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId обязателен" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEWAS_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEWAS_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
