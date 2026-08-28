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

  const webinars = await prisma.webinar.findMany({
    where: { projectId, status: "DONE" },
    select: { id: true, title: true, bizonId: true, createdAt: true, viewersCount: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webinars);
}
