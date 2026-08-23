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
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-auth-url", "/api/auth/telegram/callback");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    containerRef.current.appendChild(script);
    return () => { containerRef.current?.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f3f7] p-4">
      <div className="w-full max-w-5xl relative overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row">
        {/* Left: brand panel */}
        <div className="relative md:w-1/2 min-h-[220px] md:min-h-[560px] overflow-hidden bg-[#0c0a14] flex flex-col justify-between p-10 md:p-12">
          {/* glow bleeding up from the bottom */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-20 h-80 w-80 rounded-full bg-[#6d5cff] opacity-80 blur-[70px]" />

          {/* frosted vertical glass stripes over the glow */}
          <div className="pointer-events-none absolute inset-0 flex backdrop-blur-2xl">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1 bg-linear-90 from-[#ffffff00] via-[#0c0a14] via-[69%] to-[#ffffff30] opacity-40"
              />
            ))}
          </div>

          {/* top fade for text legibility */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0c0a14] via-transparent to-transparent" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#6d5cff] flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="Smart Bizon" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">Smart Bizon AI</span>
          </div>

          <h1 className="relative z-10 text-white text-2xl md:text-4xl font-medium leading-tight tracking-tight max-w-sm mt-8 md:mt-0">
            AI, который модерирует чат и находит горячих лидов на вебинаре
          </h1>

          <p className="relative z-10 text-white/50 text-sm mt-8 md:mt-0">
            Bizon365 · Аналитика · Скоринг лидов
          </p>
        </div>

        {/* Right: login card */}
        <div className="md:w-1/2 bg-white p-10 md:p-12 flex flex-col justify-center">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-[#6d5cff] flex items-center justify-center overflow-hidden shadow-lg shadow-[#6d5cff]/30">
              <img src="/logo.png" alt="Smart Bizon" className="h-10 w-10 object-contain" />
            </div>
            <h2 className="text-2xl font-semibold text-[#171622] tracking-tight">Вход в платформу</h2>
            <p className="text-sm text-[#6f6e7e]">Войдите через Telegram для доступа к платформе</p>
          </div>

          {denied && (
            <div className="w-full mb-5 rounded-xl border border-[#e1483a]/30 bg-[#fbeae8] text-[#e1483a] text-sm text-center px-4 py-3">
              Доступ не выдан. Обратитесь к администратору.
            </div>
          )}

          <div className="flex justify-center" ref={containerRef} />

          <p className="mt-6 text-center text-xs text-[#6f6e7e]">
            Доступ предоставляется администратором после авторизации
          </p>
        </div>
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
