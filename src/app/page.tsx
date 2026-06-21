import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { RecentWebinars } from "@/components/recent-webinars";
import { SegmentChart } from "@/components/segment-chart";
import Link from "next/link";

async function getDashboardData() {
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!project) return null;

  const [totalWebinars, totalLeads, hotLeads, warmLeads, recentWebinars, segmentStats] =
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
    warmLeads,
    conversionRate: totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : "0",
    recentWebinars,
    segmentStats,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "color-mix(in srgb, var(--accent) 12%, transparent)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}><path d="M12 3l2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 18l-4.3 2.3.8-4.8L5 7.1l4.8-.7z" /></svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Добро пожаловать!</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, maxWidth: 400, lineHeight: 1.5 }}>
          Подключите Bizon365 проект, чтобы начать автоматизацию вебинаров с помощью AI
        </p>
        <Link href="/settings" style={{ background: "var(--accent)", color: "#fff", padding: "11px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          Подключить проект →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Обзор воронки</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Проект: {data.project.name} · {data.totalWebinars} вебинаров</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/analytics" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 13px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
            Аналитика
          </Link>
          <Link href="/leads/export" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", border: "none", borderRadius: 10, padding: "9px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>
            Экспорт
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22, marginBottom: 22 }}>
        <StatsCard
          title="Всего лидов"
          value={data.totalLeads}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9" /><path d="M19 20a5.5 5.5 0 0 0-3.5-5.1" /></svg>}
          iconBg="color-mix(in srgb, var(--accent) 12%, transparent)"
          iconColor="var(--accent)"
        />
        <StatsCard
          title="Горячие лиды"
          value={data.hotLeads}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 5 2c1 2 2 3 2 6a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 3 1 3-1 0-2-1-3-3-5 2 0 3-1 3-1z" opacity=".9" /></svg>}
          iconBg="var(--redbg)"
          iconColor="var(--red)"
        />
        <StatsCard
          title="Тёплые лиды"
          value={data.warmLeads}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" /></svg>}
          iconBg="var(--amberbg)"
          iconColor="var(--amber)"
        />
        <StatsCard
          title="Конверсия"
          value={`${data.conversionRate}%`}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9" /><path d="M21 7v5h-5" /></svg>}
          iconBg="var(--bluebg)"
          iconColor="var(--blue)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          {/* Lead dynamics chart */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Динамика лидов</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>Новые лиды за последние 7 дней</p>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                Новые лиды
              </span>
            </div>
            <svg viewBox="0 0 620 200" width="100%" height="200" preserveAspectRatio="none" style={{ color: "var(--accent)", display: "block", overflow: "visible" }}>
              <defs><linearGradient id="sbArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.20" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
              <line x1="20" y1="40" x2="600" y2="40" stroke="#f0eff5" strokeWidth="1" />
              <line x1="20" y1="100" x2="600" y2="100" stroke="#f0eff5" strokeWidth="1" />
              <line x1="20" y1="160" x2="600" y2="160" stroke="#f0eff5" strokeWidth="1" />
              <path d="M20,108 L116.7,88 L213.3,100 L310,76 L406.7,84 L503.3,54 L600,69 L600,160 L20,160 Z" fill="url(#sbArea)" />
              <path d="M20,108 L116.7,88 L213.3,100 L310,76 L406.7,84 L503.3,54 L600,69" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="503.3" cy="54" r="4.5" fill="#fff" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="600" cy="69" r="4.5" fill="#fff" stroke="currentColor" strokeWidth="2.5" />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px 0", fontSize: 11.5, color: "#a3a2b0", fontWeight: 500 }}>
              <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>
          </div>

          <RecentWebinars webinars={data.recentWebinars} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <SegmentChart stats={data.segmentStats} total={data.totalLeads} />

          {/* AI Agent card */}
          <div style={{ background: "linear-gradient(160deg, var(--accent), color-mix(in srgb, var(--accent) 78%, #000))", borderRadius: 16, padding: 22, color: "#fff", boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 18l-4.3 2.3.8-4.8L5 7.1l4.8-.7z" /></svg>
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>AI Агент</span>
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.18)", padding: "3px 9px", borderRadius: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                Активен
              </span>
            </div>
            <div style={{ display: "flex", gap: 18, margin: "4px 0 16px" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{data.hotLeads}</div>
                <div style={{ fontSize: 11.5, opacity: 0.78, marginTop: 4 }}>квалиф. лидов</div>
              </div>
            </div>
            <Link href="/leads" style={{ display: "block", width: "100%", background: "#fff", color: "var(--accent)", fontWeight: 700, fontSize: 13, padding: 10, borderRadius: 10, textAlign: "center", textDecoration: "none" }}>
              Открыть диалоги
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
