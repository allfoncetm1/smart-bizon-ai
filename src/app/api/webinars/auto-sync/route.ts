import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBizon365Client } from "@/lib/bizon365";

// Вызывается через cron (напр. Vercel Cron или внешний планировщик)
// GET /api/webinars/auto-sync?secret=YOUR_SECRET
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    include: { agentConfig: true },
  });

  const results = [];

  for (const project of projects) {
    if (!project.agentConfig?.isActive) continue;

    try {
      const bizon = createBizon365Client(project.apiToken, project.bizonId);
      const { list } = await bizon.getWebinarList({ limit: 20 });

      let newCount = 0;

      for (const item of list) {
        const existing = await prisma.webinar.findUnique({
          where: { bizonId: item.webinarId },
        });

        if (existing && existing.status === "DONE") continue;

        // Запускаем синхронизацию через внутренний API
        const syncRes = await fetch(
          `${process.env.NEXTAUTH_URL}/api/webinars/sync`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              webinarId: item.webinarId,
            }),
          }
        );

        if (syncRes.ok) newCount++;
      }

      results.push({ projectId: project.id, synced: newCount });
    } catch (err) {
      console.error(`Auto-sync error for project ${project.id}:`, err);
      results.push({ projectId: project.id, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
