import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const segment = searchParams.get("segment");

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (segment) where.segment = segment;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { score: "desc" },
  });

  const webinarIds = [...new Set(leads.map((l) => l.webinarId))];
  const webinars = await prisma.webinar.findMany({
    where: { id: { in: webinarIds } },
    select: { id: true, title: true },
  });
  const webinarMap = Object.fromEntries(webinars.map((w) => [w.id, w.title]));

  const header = ["Email", "Имя", "Телефон", "Сегмент", "Балл", "Покупка", "Вебинар", "Рекомендация AI"];
  const rows = leads.map((l) => [
    l.email,
    l.name ?? "",
    l.phone ?? "",
    l.segment,
    l.score,
    l.hasPurchased ? "Да" : "Нет",
    webinarMap[l.webinarId] ?? "",
    l.notes ?? "",
  ]);

  const csv = "﻿" + [header, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
