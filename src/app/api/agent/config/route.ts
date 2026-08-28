import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ownsProject } from "@/lib/ownership";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }
  if (!(await ownsProject(projectId, session))) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
    }
    if (!(await ownsProject(projectId, session))) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
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
