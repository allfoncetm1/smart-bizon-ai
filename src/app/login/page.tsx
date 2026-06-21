"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied");

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", "SmartBizonAI_bot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", "/api/auth/telegram/callback");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    containerRef.current.appendChild(script);
    return () => { containerRef.current?.removeChild(script); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: 360, width: "100%", boxShadow: "0 4px 24px rgba(109,92,255,.08)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 56, height: 56, background: "var(--accent)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/logo.png" alt="Smart Bizon" style={{ width: 42, height: 42, objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 }}>Smart Bizon AI</h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>Войдите через Telegram для доступа к платформе</p>
        </div>

        {denied && (
          <div style={{ width: "100%", background: "var(--redbg)", border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)", color: "var(--red)", borderRadius: 10, padding: "12px 16px", fontSize: 13.5, textAlign: "center" }}>
            Доступ не выдан. Обратитесь к администратору.
          </div>
        )}

        <div ref={containerRef} />

        <p style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", margin: 0 }}>
          Доступ предоставляется администратором после авторизации
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
