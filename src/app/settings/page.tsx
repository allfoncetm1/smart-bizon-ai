"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  bizonId: string;
  apiToken: string;
  createdAt: string;
  _count: { webinars: number; leads: number };
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ name: "", bizonId: "", apiToken: "" });
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  async function createProject() {
    if (!form.name || !form.bizonId || !form.apiToken) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        setForm({ name: "", bizonId: "", apiToken: "" });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Удалить проект "${name}"? Все вебинары и лиды будут удалены.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
        <p className="text-gray-400 mt-1">Управление проектами Bizon365</p>
      </div>

      {/* Существующие проекты */}
      {projects.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Подключённые проекты</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg"
              >
                <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold text-sm">
                    {p.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    Bizon ID: {p.bizonId} · {p._count.webinars} вебинаров · {p._count.leads} лидов
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <button
                  onClick={() => deleteProject(p.id, p.name)}
                  disabled={deletingId === p.id}
                  className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40 flex-shrink-0"
                  title="Удалить проект"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Добавить проект */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">
          <Plus className="w-4 h-4 inline mr-2" />
          Подключить проект Bizon365
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Название проекта</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Мой вебинарный проект"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">ID проекта Bizon365</label>
            <input
              value={form.bizonId}
              onChange={(e) => setForm((f) => ({ ...f, bizonId: e.target.value }))}
              placeholder="12345"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Из URL: start.bizon365.ru/my/<strong>XXXX</strong>/project
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">API Token</label>
            <input
              type="password"
              value={form.apiToken}
              onChange={(e) => setForm((f) => ({ ...f, apiToken: e.target.value }))}
              placeholder="Токен из Bizon ID → Безопасность"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bizon365 → Биzon ID → Безопасность → API Token
            </p>
          </div>
          <button
            onClick={createProject}
            disabled={creating || !form.name || !form.bizonId || !form.apiToken}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saved ? "Подключено ✓" : creating ? "Подключение..." : "Подключить"}
          </button>
        </div>
      </div>

      {/* Переменные окружения */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Конфигурация (.env.local)</h2>
        <div className="space-y-2 text-sm font-mono bg-gray-950 rounded-lg p-4">
          <p><span className="text-violet-400">ANTHROPIC_API_KEY</span>=<span className="text-gray-400">sk-ant-...</span></p>
          <p><span className="text-violet-400">DATABASE_URL</span>=<span className="text-gray-400">postgresql://...</span></p>
          <p><span className="text-violet-400">TELEGRAM_BOT_TOKEN</span>=<span className="text-gray-400">123456:ABC...</span></p>
          <p><span className="text-violet-400">REDIS_URL</span>=<span className="text-gray-400">redis://localhost:6379</span></p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Заполните файл <code className="bg-gray-800 px-1 rounded">.env.local</code> в корне проекта
        </p>
      </div>
    </div>
  );
}
