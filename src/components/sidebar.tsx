"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Дашборд",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/webinars",
    label: "Вебинары",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="15" height="16" rx="2.5" /><path d="M17 9l5-3v12l-5-3" />
      </svg>
    ),
  },
  {
    href: "/leads",
    label: "CRM / Лиды",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9" /><path d="M19 20a5.5 5.5 0 0 0-3.5-5.1" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Аналитика",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/redirects",
    label: "Link Preview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
        <path d="M15 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
      </svg>
    ),
  },
  {
    href: "/agent",
    label: "Настройки агента",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 18l-4.3 2.3.8-4.8L5 12.1l4.8-.7z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Настройки",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="7" x2="20" y2="7" /><circle cx="9" cy="7" r="2.4" fill="white" />
        <line x1="4" y1="17" x2="20" y2="17" /><circle cx="15" cy="17" r="2.4" fill="white" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: 262, flexShrink: 0, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "20px 16px", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 40 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 4px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px color-mix(in srgb,var(--accent) 35%,transparent)", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>SB</span>
        </div>
        <div style={{ minWidth: 0, lineHeight: 1.15 }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", color: "var(--text)" }}>Smart Bizon AI</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Webinar Agent</div>
        </div>
      </div>

      {/* Menu label */}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#a3a2b0", textTransform: "uppercase", padding: "22px 12px 8px" }}>Меню</div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--accent)" : "var(--muted)",
                background: active ? "color-mix(in srgb, var(--accent) 11%, transparent)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* AI Agent card */}
      <div style={{ marginTop: "auto", border: "1px solid var(--border)", borderRadius: 14, padding: 14, background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, #fff), #fff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "sbPulse 2.2s infinite" }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>AI Агент активен</span>
        </div>
        <p style={{ margin: "9px 0 12px", fontSize: 12.5, lineHeight: 1.45, color: "var(--muted)" }}>
          Квалифицирует лидов и пишет в чат автоматически после вебинара.
        </p>
        <Link
          href="/agent"
          style={{ display: "block", width: "100%", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 0", borderRadius: 9, textAlign: "center", textDecoration: "none" }}
        >
          Настроить агента
        </Link>
      </div>
    </aside>
  );
}
