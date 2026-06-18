import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const segment = searchParams.get("segment");
  const webinarId = searchParams.get("webinarId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
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
