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

    return NextResponse.json({ list, count });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Ошибка получения списка" },
      { status: 500 }
    );
  }
}
