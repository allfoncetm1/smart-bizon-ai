"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Play, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        if (data.webinarId) {
          setSyncedDbId((prev) => ({ ...prev, [webinarId]: data.webinarId }));
        }
      } else {
        setSyncStatus((prev) => ({ ...prev, [webinarId]: "error" }));
        setSyncErrors((prev) => ({
          ...prev,
          [webinarId]: data.detail ?? data.error ?? `HTTP ${res.status}`,
        }));
      }
    } catch (e) {
      setSyncStatus((prev) => ({ ...prev, [webinarId]: "error" }));
      setSyncErrors((prev) => ({ ...prev, [webinarId]: String(e) }));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Вебинары</h1>
          <p className="text-gray-400 mt-1">Список вебинаров из Bizon365</p>
        </div>
        <button
          onClick={() => projectId && loadWebinars(projectId)}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Обновить список
        </button>
      </div>

      {webinars.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500">
            {loading ? "Загрузка..." : "Подключите проект в Настройках для загрузки вебинаров"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Название</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Тип</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Дата</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Зрителей</th>
                <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {webinars.map((w) => {
                const st = syncStatus[w.webinarId] ?? "idle";
                const dbId = syncedDbId[w.webinarId];
                return (
                  <tr key={w.webinarId} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm text-white">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.webinarId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        {w.type === "LiveWebinars" ? "Живой" : "Авто"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(w.created).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-300">{w.viewers}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          {st === "done" && dbId && (
                            <Link
                              href={`/webinars/${dbId}`}
                              className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                            >
                              Посмотреть →
                            </Link>
                          )}
                          <button
                            onClick={() => syncWebinar(w.webinarId)}
                            disabled={syncingId === w.webinarId}
                            className={cn(
                              "flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors",
                              st === "done"
                                ? "bg-green-500/10 text-green-400"
                                : st === "error"
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                            )}
                          >
                            {st === "loading" ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                            ) : st === "done" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : st === "error" ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {st === "idle" && "Анализировать"}
                            {st === "loading" && "Обработка..."}
                            {st === "done" && "Готово"}
                            {st === "error" && "Ошибка — повторить"}
                          </button>
                        </div>
                        {st === "error" && syncErrors[w.webinarId] && (
                          <p className="text-xs text-red-400/80 max-w-xs text-right break-all">
                            {syncErrors[w.webinarId]}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
