import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }

  const config = await prisma.agentConfig.findUnique({
    where: { projectId },
  });

  if (!config) {
    return NextResponse.json({ error: "Конфиг не найден" }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
    }

    const body = await req.json();

    const config = await prisma.agentConfig.upsert({
      where: { projectId },
      create: { projectId, ...body },
      update: body,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления конфига" },
      { status: 500 }
    );
  }
}
