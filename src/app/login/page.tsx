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
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">B</div>
          <h1 className="text-xl font-bold text-white">Smart Bizon AI</h1>
          <p className="text-gray-400 text-sm text-center">Войдите через Telegram для доступа к платформе</p>
        </div>

        {denied && (
          <div className="w-full bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm text-center">
            Доступ не выдан. Обратитесь к администратору.
          </div>
        )}

        <div ref={containerRef} />

        <p className="text-gray-600 text-xs text-center">
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
