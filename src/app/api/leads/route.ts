import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ownsProject } from "@/lib/ownership";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const segment = searchParams.get("segment");
  const webinarId = searchParams.get("webinarId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }
  if (!(await ownsProject(projectId, session))) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const where: Record<string, unknown> = { projectId };
  if (segment) where.segment = segment;
  if (webinarId) where.webinarId = webinarId;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { score: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    leads,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
