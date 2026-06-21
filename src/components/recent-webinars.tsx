import Link from "next/link";

interface Webinar {
  id: string;
  title: string;
  status: string;
  viewersCount: number;
  createdAt: Date;
  analytics: {
    hotLeadsCount: number;
    purchasesCount: number;
    conversionRate: number;
    summary?: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DONE: { label: "Готово", color: "var(--green)", bg: "var(--greenbg)", dot: "var(--green)" },
  PROCESSING: { label: "Обработка", color: "var(--amber)", bg: "var(--amberbg)", dot: "var(--amber)" },
  PENDING: { label: "Ожидание", color: "var(--muted)", bg: "var(--soft)", dot: "var(--muted)" },
  ERROR: { label: "Ошибка", color: "var(--red)", bg: "var(--redbg)", dot: "var(--red)" },
};

export function RecentWebinars({ webinars }: { webinars: Webinar[] }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 22px 14px" }}>
        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Последние вебинары</h3>
        <Link href="/webinars" style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          Все вебинары
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 96px 96px 110px", padding: "0 22px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a2b0", borderBottom: "1px solid var(--line)" }}>
        <span>Вебинар</span><span style={{ textAlign: "right" }}>Зрители</span><span style={{ textAlign: "right" }}>Лиды</span><span style={{ textAlign: "right" }}>Статус</span>
      </div>
      {webinars.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 22px", color: "var(--muted)", fontSize: 13 }}>
          Нет вебинаров. Синхронизируйте данные из Bizon365.
        </div>
      ) : (
        webinars.map((w) => {
          const st = statusConfig[w.status] ?? statusConfig.PENDING;
          const leads = w.analytics ? `${w.analytics.hotLeadsCount} / ${w.analytics.purchasesCount}` : "—";
          return (
            <Link
              key={w.id}
              href={`/webinars/${w.id}`}
              style={{ display: "grid", gridTemplateColumns: "1fr 96px 96px 110px", alignItems: "center", padding: "13px 22px", borderBottom: "1px solid var(--line)", textDecoration: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 40, height: 30, borderRadius: 7, background: "var(--soft)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#b9b8c4" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{w.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{new Date(w.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{w.viewersCount}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "var(--muted)" }}>{leads}</div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: "3px 9px", borderRadius: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                  {st.label}
                </span>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
