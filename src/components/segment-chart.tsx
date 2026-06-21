interface SegmentStat {
  segment: string;
  _count: number;
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string }> = {
  HOT: { label: "Горячие", color: "var(--red)" },
  WARM: { label: "Тёплые", color: "var(--amber)" },
  COLD: { label: "Холодные", color: "var(--blue)" },
  PURCHASED: { label: "Купили", color: "var(--green)" },
};

export function SegmentChart({ stats, total }: { stats: SegmentStat[]; total: number }) {
  const hot = stats.find((s) => s.segment === "HOT")?._count ?? 0;
  const warm = stats.find((s) => s.segment === "WARM")?._count ?? 0;
  const cold = stats.find((s) => s.segment === "COLD")?._count ?? 0;
  const purchased = stats.find((s) => s.segment === "PURCHASED")?._count ?? 0;

  const hotPct = total > 0 ? Math.round((hot / total) * 100) : 0;
  const warmPct = total > 0 ? Math.round((warm / total) * 100) : 0;
  const coldPct = total > 0 ? Math.round((cold / total) * 100) : 0;
  const purchasedPct = total > 0 ? Math.round((purchased / total) * 100) : 0;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Сегментация лидов</h3>
      <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--muted)" }}>{total} лидов в воронке</p>
      {total === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "24px 0" }}>Нет данных</p>
      ) : (
        <>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 18 }}>
            <div style={{ width: `${coldPct}%`, background: "var(--blue)" }} />
            <div style={{ width: `${warmPct}%`, background: "var(--amber)" }} />
            <div style={{ width: `${hotPct}%`, background: "var(--red)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { label: "Горячие", count: hot, pct: hotPct, color: "var(--red)" },
              { label: "Тёплые", count: warm, pct: warmPct, color: "var(--amber)" },
              { label: "Холодные", count: cold, pct: coldPct, color: "var(--blue)" },
              { label: "Купили", count: purchased, pct: purchasedPct, color: "var(--green)" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{row.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{row.count}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", width: 34, textAlign: "right" }}>{row.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Итого лидов</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{total}</span>
          </div>
        </>
      )}
    </div>
  );
}
