"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, LogOut, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";

interface Project {
  id: string;
  name: string;
  bizonId: string;
  apiToken: string;
  createdAt: string;
  _count: { webinars: number; leads: number };
}

interface TgUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
  hasAccess: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ name: "", bizonId: "", apiToken: "" });
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [users, setUsers] = useState<TgUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProjects)
      .catch(console.error);

    fetch("/api/users")
      .then((r) => {
        if (r.status === 403) return null;
        if (!r.ok) return null;
        setIsAdmin(true);
        return r.json();
      })
      .then((data) => { if (data) setUsers(data); })
      .catch(console.error);
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

  async function toggleAccess(user: TgUser) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasAccess: !user.hasAccess }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleAdmin(user: TgUser) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(user: TgUser) {
    const displayName = user.firstName ?? user.username ?? user.telegramId;
    if (!confirm(`Удалить пользователя "${displayName}"?`)) return;
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Настройки</h1>
          <p className="text-gray-400 mt-1">Управление проектами Bizon365</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-700 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>

      {/* Существующие проекты */}
      {projects.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Подключённые проекты</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold text-sm">{p.name[0].toUpperCase()}</span>
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

      {/* Пользователи (только для админа) */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Пользователи</h2>
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет зарегистрированных пользователей</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.telegramId;
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                        {(name[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <p className="text-xs text-gray-500">ID: {u.telegramId}{u.username ? ` · @${u.username}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.hasAccess ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {u.hasAccess ? "Доступ" : "Нет доступа"}
                      </span>
                      {u.isAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 text-violet-400">Админ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAccess(u)}
                        disabled={updatingId === u.id}
                        title={u.hasAccess ? "Закрыть доступ" : "Открыть доступ"}
                        className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors disabled:opacity-40"
                      >
                        {u.hasAccess ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={updatingId === u.id}
                        title={u.isAdmin ? "Убрать админа" : "Сделать админом"}
                        className="p-1.5 text-gray-500 hover:text-violet-400 transition-colors disabled:opacity-40"
                      >
                        {u.isAdmin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={updatingId === u.id}
                        title="Удалить"
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
