import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRawSession } from "@/lib/auth";

export async function GET() {
  // Raw (never-impersonated) identity — an admin browsing "as" another
  // account still needs this to populate the account switcher.
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}
