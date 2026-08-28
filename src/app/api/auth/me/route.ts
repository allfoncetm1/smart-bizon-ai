import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let viewingAs: { username: string | null; firstName: string | null } | null = null;
  if (session.viewingAsUserId) {
    const target = await prisma.user.findUnique({ where: { id: session.viewingAsUserId } });
    if (target) viewingAs = { username: target.username, firstName: target.firstName };
  }

  return NextResponse.json({
    username: session.username ?? null,
    firstName: session.firstName ?? null,
    isAdmin: session.isAdmin,
    realIsAdmin: session.realIsAdmin,
    realUserId: session.realUserId,
    viewingAsUserId: session.viewingAsUserId,
    viewingAs,
  });
}
