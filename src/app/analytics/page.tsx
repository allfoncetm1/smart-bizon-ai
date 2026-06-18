"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

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
  totals: {
    viewers: number;
    messages: number;
    spam: number;
    questions: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
  };
  totalLeads: number;
  avgConversion: number;
  webinarCount: number;
  segmentStats: { segment: string; _count: number }[];
  chartData: WebinarRow[];
}

const SEGMENT_COLORS: Record<string, string> = {
  HOT: "#ef4444",
  WARM: "#eab308",
  COLD: "#3b82f6",
};

const SEGMENT_LABELS: Record<string, string> = {
  HOT: "🔥 Горячие",
  WARM: "⚡ Тёплые",
  COLD: "❄️ Холодные",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={cn("bg-gray-900 border rounded-xl p-4", color)}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-300 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
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
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Загрузка...</div>;
  }

  const { totals, totalLeads, avgConversion, webinarCount, segmentStats, chartData } = data;

  const spamPct = totals.messages > 0 ? ((totals.spam / totals.messages) * 100).toFixed(1) : "0";
  const engagementPct = totals.viewers > 0 ? ((totals.messages / totals.viewers)).toFixed(1) : "0";

  const pieData = segmentStats.map((s) => ({
    name: SEGMENT_LABELS[s.segment] ?? s.segment,
    value: s._count,
    color: SEGMENT_COLORS[s.segment] ?? "#6b7280",
  }));

  const funnelSteps = [
    { label: "Зрители", value: totals.viewers, color: "bg-gray-600" },
    { label: "Тёплые+Горячие", value: totals.hotLeads + totals.warmLeads, color: "bg-yellow-500" },
    { label: "Горячие", value: totals.hotLeads, color: "bg-red-500" },
  ];
  const funnelMax = totals.viewers || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Аналитика</h1>
        <p className="text-gray-400 mt-1">Сводная статистика по всем вебинарам</p>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard label="Вебинаров" value={webinarCount} color="border-gray-800" />
        <StatCard label="Зрителей" value={totals.viewers.toLocaleString()} color="border-gray-800" />
        <StatCard label="Лидов" value={totalLeads.toLocaleString()} color="border-gray-800" />
        <StatCard label="Горячих" value={totals.hotLeads} sub={`${totalLeads > 0 ? ((totals.hotLeads / totalLeads) * 100).toFixed(1) : 0}% от лидов`} color="border-red-500/20" />
        <StatCard label="Тёплых" value={totals.warmLeads} sub={`${totalLeads > 0 ? ((totals.warmLeads / totalLeads) * 100).toFixed(1) : 0}% от лидов`} color="border-yellow-500/20" />
        <StatCard label="Ср. конверсия" value={`${avgConversion}%`} sub="горячих от зрителей" color="border-violet-500/20" />
      </div>

      {/* Воронка + Сегменты */}
      <div className="grid grid-cols-2 gap-4">
        {/* Воронка */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-5">Воронка конверсии</h2>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => {
              const pct = Math.round((step.value / funnelMax) * 100);
              const prevValue = i > 0 ? funnelSteps[i - 1].value : funnelMax;
              const dropPct = prevValue > 0 ? Math.round((1 - step.value / prevValue) * 100) : 0;
              return (
                <div key={step.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-300">{step.label}</span>
                    <div className="flex items-center gap-3">
                      {i > 0 && dropPct > 0 && (
                        <span className="text-xs text-red-400">−{dropPct}%</span>
                      )}
                      <span className="font-medium text-white">{step.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-7 bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className={cn("h-full rounded-lg transition-all flex items-center px-2", step.color)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 10 && <span className="text-xs text-white font-medium">{pct}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Сегменты Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-2">Сегментация лидов</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                  itemStyle={{ color: "#e5e7eb" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Перформанс вебинаров */}
      {chartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Перформанс вебинаров</h2>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {(["leads", "chat"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveChart(c)}
                  className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    activeChart === c ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  {c === "leads" ? "Лиды" : "Чат"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {activeChart === "leads" ? (
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="viewers" name="Зрители" fill="#4b5563" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warm" name="Тёплые" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hot" name="Горячие" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="messages" name="Сообщений" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="questions" name="Вопросов" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spam" name="Спам" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Доп. метрики */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Активность чата</p>
          <p className="text-xl font-bold text-white">{engagementPct}</p>
          <p className="text-xs text-gray-500 mt-1">сообщений на зрителя</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Спам в чате</p>
          <p className="text-xl font-bold text-red-400">{spamPct}%</p>
          <p className="text-xs text-gray-500 mt-1">{totals.spam} сообщений отфильтровано</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Вопросов участников</p>
          <p className="text-xl font-bold text-blue-400">{totals.questions}</p>
          <p className="text-xs text-gray-500 mt-1">обработано AI агентом</p>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Все вебинары</h2>
        </div>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Нет обработанных вебинаров</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Вебинар</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">👥</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">🔥</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">⚡</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">💬</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">Конверсия</th>
                <th className="text-right text-xs text-gray-400 font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {chartData.map((w) => (
                <tr key={w.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm text-white truncate max-w-xs">{w.fullTitle}</p>
                    <p className="text-xs text-gray-500">{w.date}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{w.viewers}</td>
                  <td className="px-4 py-3 text-right text-sm text-red-400 font-medium">{w.hot}</td>
                  <td className="px-4 py-3 text-right text-sm text-yellow-400">{w.warm}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-400">{w.messages}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-sm font-medium",
                      w.conversion > 5 ? "text-green-400" : w.conversion > 1 ? "text-yellow-400" : "text-gray-400"
                    )}>
                      {w.conversion}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/webinars/${w.id}`} className="text-xs text-violet-400 hover:text-violet-300">
                      →
                    </Link>
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
