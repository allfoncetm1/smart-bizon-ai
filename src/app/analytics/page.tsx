"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

interface WebinarRow {
  name: string;
  fullTitle: string;
  id: string;
  date: string;
  viewers: number;
  hot: number;
  warm: number;
  cold: number;
  messages: number;
  spam: number;
  questions: number;
  conversion: number;
}

interface AnalyticsData {
  totals: { viewers: number; messages: number; spam: number; questions: number; hotLeads: number; warmLeads: number; coldLeads: number };
  totalLeads: number;
  avgConversion: number;
  webinarCount: number;
  segmentStats: { segment: string; _count: number }[];
  chartData: WebinarRow[];
}

const SEGMENT_COLORS: Record<string, string> = {
  HOT: "#e1483a",
  WARM: "#d97706",
  COLD: "#2f6fed",
};

const SEGMENT_LABELS: Record<string, string> = {
  HOT: "Горячие",
  WARM: "Тёплые",
  COLD: "Холодные",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <p style={{ color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--muted)" }}>{p.name}:</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activeChart, setActiveChart] = useState<"leads" | "chat">("leads");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        const pid = projects[0]?.id;
        if (pid) return fetch(`/api/analytics?projectId=${pid}`);
      })
      .then((r) => r?.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted)", fontSize: 14 }}>Загрузка...</div>;
  }

  const { totals, totalLeads, avgConversion, webinarCount, segmentStats, chartData } = data;
  const spamPct = totals.messages > 0 ? ((totals.spam / totals.messages) * 100).toFixed(1) : "0";
  const engagementPct = totals.viewers > 0 ? (totals.messages / totals.viewers).toFixed(1) : "0";
  const funnelMax = totals.viewers || 1;

  const pieData = segmentStats.map((s) => ({
    name: SEGMENT_LABELS[s.segment] ?? s.segment,
    value: s._count,
    color: SEGMENT_COLORS[s.segment] ?? "#a3a2b0",
  }));

  const card = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 } as const;
  const card16 = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" } as const;

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Аналитика</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Сводная статистика по всем вебинарам</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Вебинаров", value: webinarCount, color: "var(--text)" },
          { label: "Зрителей", value: totals.viewers, color: "var(--text)" },
          { label: "Лидов", value: totalLeads, color: "var(--text)" },
          { label: "Горячих", value: totals.hotLeads, color: "var(--red)", sub: `${totalLeads > 0 ? ((totals.hotLeads / totalLeads) * 100).toFixed(1) : 0}% от лидов` },
          { label: "Тёплых", value: totals.warmLeads, color: "var(--amber)", sub: `${totalLeads > 0 ? ((totals.warmLeads / totalLeads) * 100).toFixed(1) : 0}% от лидов` },
          { label: "Ср. конверсия", value: `${avgConversion}%`, color: "var(--accent)", sub: "горячих от зрителей" },
        ].map((item) => (
          <div key={item.label} style={card}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: item.color }}>{item.value}</div>
            {"sub" in item && item.sub && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Funnel + Segments */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 22, marginBottom: 22 }}>
        <div style={card16}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Воронка конверсии</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Зрители", value: totals.viewers, pct: 100, color: "var(--blue)" },
              { label: "Тёплые + Горячие", value: totals.hotLeads + totals.warmLeads, pct: Math.round(((totals.hotLeads + totals.warmLeads) / funnelMax) * 100), color: "var(--amber)" },
              { label: "Горячие", value: totals.hotLeads, pct: Math.round((totals.hotLeads / funnelMax) * 100), color: "var(--red)" },
            ].map((step) => (
              <div key={step.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{step.label}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{step.value} · {step.pct}%</span>
                </div>
                <div style={{ height: 34, borderRadius: 9, background: step.color, width: `${Math.max(step.pct, 4)}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div style={card16}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Сегментация лидов</h3>
          {pieData.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "32px 0", fontSize: 13 }}>Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "var(--text)" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "var(--muted)", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Extra metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        <div style={card}><div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>Активность чата</div><div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{engagementPct}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>сообщений на зрителя</div></div>
        <div style={card}><div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>Спам в чате</div><div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{spamPct}%</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{totals.spam} сообщений отфильтровано</div></div>
        <div style={card}><div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>Вопросов участников</div><div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{totals.questions}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>обработано AI агентом</div></div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ ...card16, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Перформанс вебинаров</h3>
              <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--muted)" }}>
                {[{ color: "var(--blue)", label: "Зрители" }, { color: "var(--amber)", label: "Тёплые" }, { color: "var(--red)", label: "Горячие" }].map((l) => (
                  <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: l.color, display: "inline-block" }} />{l.label}</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 9, padding: 4 }}>
              {(["leads", "chat"] as const).map((c) => (
                <button key={c} onClick={() => setActiveChart(c)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit", background: activeChart === c ? "var(--accent)" : "transparent", color: activeChart === c ? "#fff" : "var(--muted)" }}>
                  {c === "leads" ? "Лиды" : "Чат"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            {activeChart === "leads" ? (
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fill: "#a3a2b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a3a2b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="viewers" name="Зрители" fill="#2f6fed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warm" name="Тёплые" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hot" name="Горячие" fill="#e1483a" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fill: "#a3a2b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a3a2b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messages" name="Сообщений" fill="#6d5cff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="questions" name="Вопросов" fill="#8b7bff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spam" name="Спам" fill="#e1483a" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, padding: "22px 22px 14px", color: "var(--text)" }}>Все вебинары</h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)", fontSize: 14 }}>Нет обработанных вебинаров</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Вебинар", "Зрит.", "🔥", "⚡", "Чат", "Конв.", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a2b0", padding: "0 22px 8px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((w) => (
                <tr key={w.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "13px 22px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>{w.fullTitle}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{w.date}</div>
                  </td>
                  <td style={{ textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--text)", padding: "13px 22px" }}>{w.viewers}</td>
                  <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--red)", padding: "13px 22px" }}>{w.hot}</td>
                  <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--amber)", padding: "13px 22px" }}>{w.warm}</td>
                  <td style={{ textAlign: "right", fontSize: 13, color: "var(--muted)", padding: "13px 22px" }}>{w.messages}</td>
                  <td style={{ textAlign: "right", padding: "13px 22px" }}>
                    <span style={{ display: "inline-flex", fontSize: 12, fontWeight: 700, color: w.conversion > 5 ? "var(--green)" : w.conversion > 1 ? "var(--amber)" : "var(--muted)", background: w.conversion > 5 ? "var(--greenbg)" : w.conversion > 1 ? "var(--amberbg)" : "var(--soft)", padding: "3px 9px", borderRadius: 20 }}>{w.conversion}%</span>
                  </td>
                  <td style={{ textAlign: "right", padding: "13px 22px" }}>
                    <Link href={`/webinars/${w.id}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>→</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
