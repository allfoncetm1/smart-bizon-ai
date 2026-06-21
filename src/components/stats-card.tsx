import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; label: string; positive: boolean };
}

export function StatsCard({ title, value, icon, iconBg, iconColor, trend }: StatsCardProps) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)" }}>{title}</span>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 14, lineHeight: 1, color: "var(--text)" }}>{value}</div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 11 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: trend.positive ? "var(--green)" : "var(--red)", background: trend.positive ? "var(--greenbg)" : "var(--redbg)", padding: "2px 7px", borderRadius: 20 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {trend.positive ? <path d="M5 15l7-7 7 7" /> : <path d="M5 9l7 7 7-7" />}
            </svg>
            {trend.value}
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
