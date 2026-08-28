import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const webinar = await prisma.webinar.findUnique({
    where: { id },
    include: {
      analytics: true,
      chatMessages: {
        orderBy: { sentAt: "asc" },
        take: 500,
      },
      participants: {
        orderBy: { score: "desc" },
        take: 100,
      },
      project: { select: { userId: true } },
    },
  });

  if (!webinar || (webinar.project.userId !== session.userId && !session.isAdmin)) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  const { project: _project, ...rest } = webinar;
  return NextResponse.json(rest);
}
