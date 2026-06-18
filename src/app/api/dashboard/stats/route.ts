import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }

  const [
    totalWebinars,
    totalLeads,
    hotLeads,
    purchases,
    recentWebinars,
    segmentStats,
  ] = await Promise.all([
    prisma.webinar.count({ where: { projectId } }),
    prisma.lead.count({ where: { projectId } }),
    prisma.lead.count({ where: { projectId, segment: "HOT" } }),
    prisma.lead.count({ where: { projectId, hasPurchased: true } }),
    prisma.webinar.findMany({
      where: { projectId },
      include: { analytics: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lead.groupBy({
      by: ["segment"],
      where: { projectId },
      _count: true,
    }),
  ]);

  const conversionRate =
    totalLeads > 0 ? ((purchases / totalLeads) * 100).toFixed(1) : "0";

  return NextResponse.json({
    totalWebinars,
    totalLeads,
    hotLeads,
    purchases,
    conversionRate,
    recentWebinars,
    segmentStats,
  });
}
