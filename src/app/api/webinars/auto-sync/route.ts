import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBizon365Client } from "@/lib/bizon365";

// Вызывается Vercel Cron — авторизуется через Authorization: Bearer <CRON_SECRET>
// Запасной вариант: ?secret=<CRON_SECRET> в URL
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = new URL(req.url).searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  const authorized =
    cronSecret && (bearerSecret === cronSecret || querySecret === cronSecret);

  if (!authorized) {
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
      // Берём последние 5 вебинаров — меньше запросов, быстрее
      const { list } = await bizon.getWebinarList({ limit: 5 });

      let newCount = 0;

      for (const item of list) {
        const existing = await prisma.webinar.findUnique({
          where: { bizonId: item.webinarId },
          select: { id: true, status: true },
        });

        // Пропускаем уже готовые и те что в обработке прямо сейчас
        if (existing?.status === "DONE" || existing?.status === "PROCESSING") continue;

        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";

        const syncRes = await fetch(`${baseUrl}/api/webinars/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, webinarId: item.webinarId }),
        });

        if (syncRes.ok) newCount++;
      }

      results.push({ projectId: project.id, synced: newCount });
    } catch (err) {
      console.error(`Auto-sync error for project ${project.id}:`, err);
      results.push({ projectId: project.id, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, results, ts: new Date().toISOString() });
}
