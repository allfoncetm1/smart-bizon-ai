import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Не найден" }, { status: 404 });
  }

  return NextResponse.json(webinar);
}
