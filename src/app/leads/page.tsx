"use client";

import { useState, useEffect, useRef } from "react";
import { Download, ChevronDown, ChevronUp, Copy, Check, Video } from "lucide-react";

interface SyncedWebinar {
  id: string;
  title: string;
  bizonId: string;
  viewersCount: number;
}

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
  { key: "HOT", label: "Горячие" },
  { key: "WARM", label: "Тёплые" },
  { key: "COLD", label: "Холодные" },
];

const segmentColors: Record<string, { color: string; bg: string; dot: string }> = {
  HOT: { color: "var(--red)", bg: "var(--redbg)", dot: "var(--red)" },
  WARM: { color: "var(--amber)", bg: "var(--amberbg)", dot: "var(--amber)" },
  COLD: { color: "var(--blue)", bg: "var(--bluebg)", dot: "var(--blue)" },
};

const segmentLabel: Record<string, string> = {
  HOT: "Горячий",
  WARM: "Тёплый",
  COLD: "Холодный",
};

function WebinarSelect({ webinars, value, onChange }: { webinars: SyncedWebinar[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = webinars.find((w) => w.id === value);
  const label = selected ? selected.title : "Все вебинары";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, color: "var(--text)", cursor: "pointer", minWidth: 200, maxWidth: 320, textAlign: "left" }}>
        <Video size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <ChevronDown size={13} color="var(--muted)" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 24px rgba(20,20,50,.1)", zIndex: 50, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
          {[{ id: "", title: "Все вебинары", viewersCount: 0, bizonId: "" }, ...webinars].map((w) => (
            <button key={w.id || "__all"} onClick={() => { onChange(w.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", background: value === w.id ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: value === w.id ? "var(--accent)" : "var(--text)", textAlign: "left", gap: 8 }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.id ? w.title : "Все вебинары"}</span>
              {w.id && <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0, background: "var(--soft)", padding: "2px 8px", borderRadius: 10 }}>{w.viewersCount}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} style={{ flexShrink: 0, padding: "2px 4px", borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>
      {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
    </button>
  );
}

function AiCard({ lead }: { lead: Lead }) {
  const hasChatMessages = lead.chatMessages && lead.chatMessages.length > 0;
  return (
    <div style={{ background: "var(--soft)", borderTop: "1px solid var(--border)" }}>
      {hasChatMessages && (
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>💬 Писал в чате вебинара ({lead.chatMessages.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lead.chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--card)", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>{msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {!lead.aiCardAt ? (
        <div style={{ padding: "16px 22px" }}>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>AI-карточка не сгенерирована. Участник попал вне топ-30 по баллу — пересинхронизируйте вебинар.</p>
        </div>
      ) : (
        <div style={{ padding: "16px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>🎯 Боли</p>
            {lead.painPoints?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lead.painPoints.map((p, i) => (
                  <span key={i} style={{ fontSize: 12, background: "var(--amberbg)", color: "var(--amber)", padding: "2px 8px", borderRadius: 20 }}>{p}</span>
                ))}
              </div>
            ) : <p style={{ fontSize: 12, color: "var(--muted)" }}>Не определены</p>}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>⚠️ Возражения</p>
            {lead.objections?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lead.objections.map((o, i) => (
                  <span key={i} style={{ fontSize: 12, background: "var(--redbg)", color: "var(--red)", padding: "2px 8px", borderRadius: 20 }}>{o}</span>
                ))}
              </div>
            ) : <p style={{ fontSize: 12, color: "var(--muted)" }}>Не определены</p>}
          </div>
          {lead.openingPhrase && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>📞 Первая фраза для звонка</p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 13, color: "var(--text)", flex: 1, lineHeight: 1.5, margin: 0 }}>{lead.openingPhrase}</p>
                <CopyButton text={lead.openingPhrase} />
              </div>
            </div>
          )}
          {lead.recommendedProduct && (
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>🛍️ Рекомендовать</p>
              <span style={{ fontSize: 12, background: "var(--greenbg)", color: "var(--green)", padding: "5px 12px", borderRadius: 8 }}>{lead.recommendedProduct}</span>
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
  const [webinars, setWebinars] = useState<SyncedWebinar[]>([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        if (projects[0]) {
          setProjectId(projects[0].id);
          fetch(`/api/webinars/synced?projectId=${projects[0].id}`).then((r) => r.json()).then(setWebinars);
        }
      });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    loadLeads(1);
  }, [projectId, segment, selectedWebinarId]);

  async function loadLeads(p: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId, page: String(p) });
      if (segment) params.set("segment", segment);
      if (selectedWebinarId) params.set("webinarId", selectedWebinarId);
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

  const filtered = leads.filter((l) => !search || l.email.includes(search) || (l.name ?? "").toLowerCase().includes(search.toLowerCase()));

  function exportCsv() {
    const params = new URLSearchParams({ projectId });
    if (segment) params.set("segment", segment);
    window.open(`/api/leads/export?${params}`, "_blank");
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>CRM / Лиды</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Всего: {total} лидов · квалифицированы AI агентом</p>
        </div>
        <button onClick={exportCsv} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          <Download size={15} />
          Экспорт CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 11, padding: 4 }}>
          {SEGMENTS.map((s) => (
            <button key={s.key} onClick={() => setSegment(s.key)} style={{ fontSize: 13, fontWeight: segment === s.key ? 600 : 500, color: segment === s.key ? "#fff" : "var(--text)", background: segment === s.key ? "var(--accent)" : "transparent", padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {s.key && <span style={{ width: 8, height: 8, borderRadius: "50%", background: segmentColors[s.key]?.dot, display: "inline-block" }} />}
              {s.label}
            </button>
          ))}
        </div>

        {webinars.length > 0 && (
          <WebinarSelect webinars={webinars} value={selectedWebinarId} onChange={(v) => { setSelectedWebinarId(v); setExpandedId(null); }} />
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", width: 260 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a3a2b0" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по email или имени…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--text)", width: "100%" }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)", fontSize: 14 }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)", fontSize: 14 }}>
            Нет лидов. Синхронизируйте вебинар для заполнения CRM.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Контакт", "Сегмент", "Балл", "Рекомендация AI", "Карточка"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 4 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a2b0", padding: "15px 22px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.flatMap((lead) => {
                const seg = segmentColors[lead.segment] ?? { color: "var(--muted)", bg: "var(--soft)", dot: "var(--muted)" };
                const rows = [
                  <tr key={lead.id} onClick={() => toggleExpand(lead.id)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
                    <td style={{ padding: "13px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--soft)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                          {(lead.name ?? lead.email).trim().charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{lead.name ?? lead.email}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{lead.phone ?? lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 22px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: seg.color, background: seg.bg, padding: "3px 11px", borderRadius: 20 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: seg.dot, display: "inline-block" }} />
                        {segmentLabel[lead.segment] ?? lead.segment}
                      </span>
                    </td>
                    <td style={{ padding: "13px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, width: 22, color: "var(--text)" }}>{lead.score}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--line)", borderRadius: 6, overflow: "hidden", maxWidth: 60 }}>
                          <div style={{ height: 6, borderRadius: 6, width: `${lead.score}%`, background: lead.score >= 70 ? "var(--red)" : lead.score >= 40 ? "var(--amber)" : "var(--blue)" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 22px", fontSize: 13, color: "var(--text)" }}>{lead.notes ?? "—"}</td>
                    <td style={{ padding: "13px 22px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "5px 11px", borderRadius: 8 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /></svg>
                        {expandedId === lead.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Открыть
                      </div>
                    </td>
                  </tr>,
                ];
                if (expandedId === lead.id) {
                  rows.push(
                    <tr key={`${lead.id}-card`}>
                      <td colSpan={5} style={{ padding: 0 }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Страница {page} / {pages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => loadLeads(page - 1)} disabled={page <= 1 || loading} style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--muted)", cursor: "pointer", opacity: page <= 1 ? 0.4 : 1 }}>← Назад</button>
            <button onClick={() => loadLeads(page + 1)} disabled={page >= pages || loading} style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", opacity: page >= pages ? 0.4 : 1 }}>Вперёд →</button>
          </div>
        </div>
      )}
    </div>
  );
}
