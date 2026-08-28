"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const screenTitles: Record<string, string> = {
  "/": "Дашборд",
  "/webinars": "Вебинары",
  "/leads": "CRM / Лиды",
  "/analytics": "Аналитика",
  "/redirects": "Link Preview",
  "/agent": "Настройки агента",
  "/settings": "Настройки",
};

interface Me {
  username: string | null;
  firstName: string | null;
  isAdmin: boolean;
}

export function TopBar() {
  const pathname = usePathname();
  const title = screenTitles[pathname] ?? "Smart Bizon AI";
  const [projectName, setProjectName] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects) => { if (projects[0]) setProjectName(projects[0].name); })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Полная перезагрузка вместо роутинга — сбрасывает весь клиентский
      // стейт/кэш, чтобы данные предыдущего аккаунта нигде не задержались.
      window.location.href = "/login";
    }
  }

  const displayName = me?.firstName ?? me?.username ?? "Аккаунт";
  const roleLabel = me?.isAdmin ? "Администратор" : "Пользователь";

  return (
    <header style={{
      flexShrink: 0,
      height: 66,
      borderBottom: "1px solid var(--border)",
      background: "color-mix(in srgb, var(--card) 86%, transparent)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text)" }}>{title}</h1>

      {projectName && (
        <button style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          Проект: {projectName}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", width: 240 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a3a2b0", flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" /></svg>
          <input placeholder="Поиск по имени, email…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--text)", width: "100%" }} />
        </div>

        {/* Bell */}
        <button style={{ position: "relative", width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text)" }}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
          <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: "var(--red)", border: "2px solid var(--card)" }} />
        </button>

        <div style={{ width: 1, height: 26, background: "var(--border)" }} />

        {/* User */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <div
            onClick={() => setMenuOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src="/logo.png" alt="SB" style={{ width: 26, height: 26, objectFit: "contain" }} />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{displayName}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{roleLabel}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {menuOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 200,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(20,20,50,.12)",
              padding: 6,
              zIndex: 40,
            }}>
              {me?.username && (
                <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
                  @{me.username}
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 10px",
                  border: "none",
                  background: "transparent",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--red)",
                  opacity: loggingOut ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--redbg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
                {loggingOut ? "Выходим..." : "Сменить аккаунт"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
