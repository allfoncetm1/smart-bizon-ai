import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBizon365Client } from "@/lib/bizon365";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  try {
    const bizon = createBizon365Client(project.apiToken, project.bizonId);
    const { list, count } = await bizon.getWebinarList({ limit: 50 });

    // Подменяем технические имена реальными названиями из нашей БД
    const dbWebinars = await prisma.webinar.findMany({
      where: { projectId, bizonId: { in: list.map((w) => w.webinarId) } },
      select: { bizonId: true, title: true, id: true, status: true },
    });
    const dbMap: Record<string, { title: string; id: string; status: string }> = {};
    for (const w of dbWebinars) dbMap[w.bizonId] = { title: w.title, id: w.id, status: w.status };

    const enrichedList = list.map((w) => ({
      ...w,
      name: dbMap[w.webinarId]?.title && dbMap[w.webinarId].title !== "Загрузка..."
        ? dbMap[w.webinarId].title
        : w.name,
      dbId: dbMap[w.webinarId]?.id ?? null,
      syncStatus: dbMap[w.webinarId]?.status ?? null,
    }));

    return NextResponse.json({ list: enrichedList, count });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Ошибка получения списка" },
      { status: 500 }
    );
  }
}
