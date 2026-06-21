"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BizonWebinar {
  webinarId: string;
  name: string;
  type: string;
  created: string;
  viewers: number;
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<BizonWebinar[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [syncedDbId, setSyncedDbId] = useState<Record<string, string>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string>("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        if (projects[0]) {
          setProjectId(projects[0].id);
          loadWebinars(projects[0].id);
        }
      });
  }, []);

  async function loadWebinars(pid: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/webinars/list?projectId=${pid}`);
      const data = await res.json();
      setWebinars(data.list ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function syncWebinar(webinarId: string) {
    setSyncStatus((prev) => ({ ...prev, [webinarId]: "loading" }));
    setSyncErrors((prev) => ({ ...prev, [webinarId]: "" }));
    setSyncingId(webinarId);
    try {
      const res = await fetch("/api/webinars/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, webinarId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus((prev) => ({ ...prev, [webinarId]: "done" }));
        if (data.webinarId) setSyncedDbId((prev) => ({ ...prev, [webinarId]: data.webinarId }));
      } else {
        setSyncStatus((prev) => ({ ...prev, [webinarId]: "error" }));
        setSyncErrors((prev) => ({ ...prev, [webinarId]: data.detail ?? data.error ?? `HTTP ${res.status}` }));
      }
    } catch (e) {
      setSyncStatus((prev) => ({ ...prev, [webinarId]: "error" }));
      setSyncErrors((prev) => ({ ...prev, [webinarId]: String(e) }));
    } finally {
      setSyncingId(null);
    }
  }

  const autoStyle = { display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600, color: "var(--blue)", background: "var(--bluebg)", padding: "3px 11px", borderRadius: 20 };
  const liveStyle = { display: "inline-flex", alignItems: "center", fontSize: 12, fontWeight: 600, color: "var(--red)", background: "var(--redbg)", padding: "3px 11px", borderRadius: 20 };
  const analyzeStyle = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit" };
  const procStyle = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--soft)", padding: "6px 13px", borderRadius: 8, border: "none", fontFamily: "inherit" };
  const doneStyle = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--green)", background: "var(--greenbg)", padding: "6px 13px", borderRadius: 8, border: "none", fontFamily: "inherit" };
  const errStyle = { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--red)", background: "var(--redbg)", padding: "6px 13px", borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "inherit" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Вебинары</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Список вебинаров из Bizon365 · {webinars.length} записей</p>
        </div>
        <button
          onClick={() => projectId && loadWebinars(projectId)}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--text)", opacity: loading ? 0.6 : 1 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? "sbSpin 1s linear infinite" : "none" }}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5h-5" /></svg>
          Обновить список
        </button>
      </div>

      {webinars.length === 0 ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {loading ? "Загрузка..." : "Подключите проект в Настройках для загрузки вебинаров"}
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 110px 150px", padding: "15px 22px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "#a3a2b0", borderBottom: "1px solid var(--border)" }}>
            <span>Название</span><span>Тип</span><span>Дата</span><span style={{ textAlign: "right" }}>Зрителей</span><span style={{ textAlign: "right" }}>Действие</span>
          </div>
          {webinars.map((w) => {
            const st = syncStatus[w.webinarId] ?? "idle";
            const dbId = syncedDbId[w.webinarId];
            return (
              <div key={w.webinarId} style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 110px 150px", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: "color-mix(in srgb, var(--accent) 11%, transparent)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{w.webinarId}</div>
                  </div>
                </div>
                <div>
                  <span style={w.type === "LiveWebinars" ? liveStyle : autoStyle}>
                    {w.type === "LiveWebinars" ? "Живой" : "Авто"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{new Date(w.created).toLocaleDateString("ru-RU")}</div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{w.viewers}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {st === "done" && dbId && (
                        <Link href={`/webinars/${dbId}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                          Посмотреть →
                        </Link>
                      )}
                      <button
                        onClick={() => syncWebinar(w.webinarId)}
                        disabled={syncingId === w.webinarId}
                        style={st === "done" ? doneStyle : st === "error" ? errStyle : st === "loading" ? procStyle : analyzeStyle}
                      >
                        {st === "loading" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "sbSpin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v5h-5" /></svg>}
                        {st === "idle" && "Анализировать"}
                        {st === "loading" && "Обработка..."}
                        {st === "done" && "✓ Готово"}
                        {st === "error" && "Ошибка — повторить"}
                      </button>
                    </div>
                    {st === "error" && syncErrors[w.webinarId] && (
                      <p style={{ fontSize: 11, color: "var(--red)", maxWidth: 200, textAlign: "right", wordBreak: "break-all" as const }}>{syncErrors[w.webinarId]}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Показано {webinars.length} записей</span>
          </div>
        </div>
      )}
    </div>
  );
}
