import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { RecentWebinars } from "@/components/recent-webinars";
import { SegmentChart } from "@/components/segment-chart";
import { Users, TrendingUp, Flame } from "lucide-react";

async function getDashboardData() {
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!project) return null;

  const [totalWebinars, totalLeads, hotLeads, purchases, recentWebinars, segmentStats] =
    await Promise.all([
      prisma.webinar.count({ where: { projectId: project.id } }),
      prisma.lead.count({ where: { projectId: project.id } }),
      prisma.lead.count({ where: { projectId: project.id, segment: "HOT" } }),
      prisma.lead.count({ where: { projectId: project.id, segment: "WARM" } }),
      prisma.webinar.findMany({
        where: { projectId: project.id },
        include: { analytics: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lead.groupBy({
        by: ["segment"],
        where: { projectId: project.id },
        _count: true,
      }),
    ]);

  return {
    project,
    totalWebinars,
    totalLeads,
    hotLeads,
    warmLeads: purchases,
    conversionRate: totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : "0",
    recentWebinars,
    segmentStats,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-violet-600/20 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Добро пожаловать!</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          Подключите Bizon365 проект, чтобы начать автоматизацию вебинаров с помощью AI
        </p>
        <a
          href="/settings"
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Подключить проект →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-gray-400 mt-1">
          Проект: <span className="text-violet-400">{data.project.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Всего лидов"
          value={data.totalLeads}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Горячие лиды"
          value={data.hotLeads}
          icon={<Flame className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Тёплые лиды"
          value={data.warmLeads}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Конверсия"
          value={`${data.conversionRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <RecentWebinars webinars={data.recentWebinars} />
        </div>
        <div>
          <SegmentChart stats={data.segmentStats} total={data.totalLeads} />
        </div>
      </div>
    </div>
  );
}
