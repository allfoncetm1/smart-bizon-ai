import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Удаляем в правильном порядке из-за FK
    await prisma.agentConfig.deleteMany({ where: { projectId: id } });
    await prisma.lead.deleteMany({ where: { projectId: id } });

    const webinars = await prisma.webinar.findMany({ where: { projectId: id }, select: { id: true } });
    const webinarIds = webinars.map((w) => w.id);

    if (webinarIds.length > 0) {
      await prisma.chatMessage.deleteMany({ where: { webinarId: { in: webinarIds } } });
      await prisma.participant.deleteMany({ where: { webinarId: { in: webinarIds } } });
      await prisma.webinarAnalytics.deleteMany({ where: { webinarId: { in: webinarIds } } });
      await prisma.webinar.deleteMany({ where: { projectId: id } });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
