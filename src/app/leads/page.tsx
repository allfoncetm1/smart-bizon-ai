"use client";

import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  segment: string;
  score: number;
  notes: string | null;
  hasPurchased: boolean;
  createdAt: string;
}

const SEGMENTS = [
  { key: "", label: "Все" },
  { key: "HOT", label: "🔥 Горячие" },
  { key: "WARM", label: "⚡ Тёплые" },
  { key: "COLD", label: "❄️ Холодные" },
];

const segmentBadge: Record<string, string> = {
  HOT: "bg-red-500/10 text-red-400 border border-red-500/20",
  WARM: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  COLD: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

const segmentLabel: Record<string, string> = {
  HOT: "🔥 Горячий",
  WARM: "⚡ Тёплый",
  COLD: "❄️ Холодный",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [segment, setSegment] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        if (projects[0]) setProjectId(projects[0].id);
      });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadLeads(1);
  }, [projectId, segment]);

  async function loadLeads(p: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId, page: String(p) });
      if (segment) params.set("segment", segment);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leads.filter(
    (l) =>
      !search ||
      l.email.includes(search) ||
      (l.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function exportCsv() {
    const params = new URLSearchParams({ projectId });
    if (segment) params.set("segment", segment);
    window.open(`/api/leads/export?${params}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM / Лиды</h1>
          <p className="text-gray-400 mt-1">
            Всего: <span className="text-white font-medium">{total}</span> лидов
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Экспорт CSV
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-3">
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 gap-1">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                segment === s.key
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Нет лидов. Синхронизируйте вебинар для заполнения CRM.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Контакт</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Сегмент</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Балл</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Рекомендация AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm text-white">{lead.name ?? lead.email}</p>
                    <p className="text-xs text-gray-500">{lead.email}</p>
                    {lead.phone && (
                      <p className="text-xs text-gray-500">{lead.phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-1 rounded-full", segmentBadge[lead.segment])}>
                      {segmentLabel[lead.segment] ?? lead.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            lead.score >= 70 ? "bg-red-500" : lead.score >= 40 ? "bg-yellow-500" : "bg-blue-500"
                          )}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-white">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-xs text-gray-400 truncate">{lead.notes ?? "—"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => loadLeads(page - 1)}
            disabled={page <= 1 || loading}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 text-sm"
          >
            ← Назад
          </button>
          <span className="text-sm text-gray-400">
            {page} / {pages}
          </span>
          <button
            onClick={() => loadLeads(page + 1)}
            disabled={page >= pages || loading}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 text-sm"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
