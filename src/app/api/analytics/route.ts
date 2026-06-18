import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const webinars = await prisma.webinar.findMany({
    where: { projectId, status: "DONE" },
    include: { analytics: true },
    orderBy: { createdAt: "asc" },
  });

  const [segmentStats, totalLeads] = await Promise.all([
    prisma.lead.groupBy({
      by: ["segment"],
      where: { projectId },
      _count: true,
    }),
    prisma.lead.count({ where: { projectId } }),
  ]);

  const totals = webinars.reduce(
    (acc, w) => {
      if (!w.analytics) return acc;
      return {
        viewers: acc.viewers + w.analytics.totalViewers,
        messages: acc.messages + w.analytics.chatMessagesCount,
        spam: acc.spam + w.analytics.spamCount,
        questions: acc.questions + w.analytics.questionsCount,
        hotLeads: acc.hotLeads + w.analytics.hotLeadsCount,
        warmLeads: acc.warmLeads + w.analytics.warmLeadsCount,
        coldLeads: acc.coldLeads + w.analytics.coldLeadsCount,
      };
    },
    { viewers: 0, messages: 0, spam: 0, questions: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0 }
  );

  const avgConversion = webinars.length > 0
    ? webinars.reduce((sum, w) => sum + (w.analytics?.conversionRate ?? 0), 0) / webinars.length
    : 0;

  const chartData = webinars.map((w) => ({
    name: w.title.slice(0, 20) + (w.title.length > 20 ? "…" : ""),
    fullTitle: w.title,
    id: w.id,
    date: new Date(w.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    viewers: w.analytics?.totalViewers ?? 0,
    hot: w.analytics?.hotLeadsCount ?? 0,
    warm: w.analytics?.warmLeadsCount ?? 0,
    cold: w.analytics?.coldLeadsCount ?? 0,
    messages: w.analytics?.chatMessagesCount ?? 0,
    spam: w.analytics?.spamCount ?? 0,
    questions: w.analytics?.questionsCount ?? 0,
    conversion: Number((w.analytics?.conversionRate ?? 0).toFixed(1)),
  }));

  return NextResponse.json({
    totals,
    totalLeads,
    avgConversion: Number(avgConversion.toFixed(1)),
    webinarCount: webinars.length,
    segmentStats,
    chartData,
  });
}
