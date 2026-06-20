"use client";

import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
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
  painPoints: string[];
  objections: string[];
  openingPhrase: string | null;
  recommendedProduct: string | null;
  aiCardAt: string | null;
  chatMessages: string[];
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-violet-400 transition-colors"
      title="Копировать"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AiCard({ lead }: { lead: Lead }) {
  const hasPainPoints = lead.painPoints && lead.painPoints.length > 0;
  const hasObjections = lead.objections && lead.objections.length > 0;
  const hasChatMessages = lead.chatMessages && lead.chatMessages.length > 0;

  return (
    <div className="bg-gray-950 border-t border-gray-800">
      {/* Сообщения в чате — всегда показываем если есть */}
      {hasChatMessages && (
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5">
            <span>💬</span> Писал в чате вебинара ({lead.chatMessages.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {lead.chatMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 bg-gray-900 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600 mt-0.5 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-200 leading-relaxed">{msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI карточка */}
      {!lead.aiCardAt ? (
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500">AI-карточка не сгенерирована. Участник попал вне топ-30 по баллу — пересинхронизируйте вебинар.</p>
        </div>
      ) : (
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {/* Боли */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <span>🎯</span> Боли
            </p>
            {hasPainPoints ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.painPoints.map((p, i) => (
                  <span key={i} className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">Не определены</p>
            )}
          </div>

          {/* Возражения */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Вероятные возражения
            </p>
            {hasObjections ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.objections.map((o, i) => (
                  <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">
                    {o}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600">Не определены</p>
            )}
          </div>

          {/* Открывашка */}
          {lead.openingPhrase && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <span>📞</span> Первая фраза для звонка
              </p>
              <div className="flex items-start gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2.5">
                <p className="text-sm text-violet-200 flex-1 leading-relaxed">{lead.openingPhrase}</p>
                <CopyButton text={lead.openingPhrase} />
              </div>
            </div>
          )}

          {/* Рекомендуемый продукт */}
          {lead.recommendedProduct && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <span>🛍️</span> Рекомендовать
              </p>
              <span className="text-xs bg-green-500/10 text-green-300 border border-green-500/20 px-3 py-1.5 rounded-lg inline-block">
                {lead.recommendedProduct}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [segment, setSegment] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
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
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Рекомендация</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">AI карточка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.flatMap((lead) => {
                const rows = [
                  <tr
                    key={lead.id}
                    onClick={() => toggleExpand(lead.id)}
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
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
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {lead.aiCardAt ? (
                          <span className="text-xs text-violet-400 font-medium">🤖 Есть</span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                        {expandedId === lead.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                    </td>
                  </tr>,
                ];
                if (expandedId === lead.id) {
                  rows.push(
                    <tr key={`${lead.id}-card`}>
                      <td colSpan={5} className="p-0">
                        <AiCard lead={lead} />
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
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
