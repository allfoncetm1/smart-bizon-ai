"use client";

import { useState, useEffect } from "react";
import { Trash2, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";

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

const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 14, color: "var(--text)", background: "var(--card)", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 7, color: "var(--text)" };
const card: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" };

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
    fetch("/api/projects").then((r) => (r.ok ? r.json() : [])).then(setProjects).catch(console.error);
    fetch("/api/users").then((r) => {
      if (r.status === 403 || !r.ok) return null;
      setIsAdmin(true);
      return r.json();
    }).then((data) => { if (data) setUsers(data); }).catch(console.error);
  }, []);

  async function createProject() {
    if (!form.name || !form.bizonId || !form.apiToken) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        setForm({ name: "", bizonId: "", apiToken: "" });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally { setCreating(false); }
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Удалить проект "${name}"? Все вебинары и лиды будут удалены.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally { setDeletingId(null); }
  }

  async function toggleAccess(user: TgUser) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hasAccess: !user.hasAccess }) });
      if (res.ok) { const u = await res.json(); setUsers((prev) => prev.map((x) => x.id === u.id ? u : x)); }
    } finally { setUpdatingId(null); }
  }

  async function toggleAdmin(user: TgUser) {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAdmin: !user.isAdmin }) });
      if (res.ok) { const u = await res.json(); setUsers((prev) => prev.map((x) => x.id === u.id ? u : x)); }
    } finally { setUpdatingId(null); }
  }

  async function deleteUser(user: TgUser) {
    const name = user.firstName ?? user.username ?? user.telegramId;
    if (!confirm(`Удалить пользователя "${name}"?`)) return;
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } finally { setUpdatingId(null); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Настройки</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Управление проектами Bizon365</p>
        </div>
        <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--red)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          Выйти
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Connected projects */}
        {projects.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Подключённые проекты</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "var(--soft)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Bizon ID {p.bizonId} · {p._count.webinars} вебинаров · {p._count.leads} лидов</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--green)", background: "var(--greenbg)", padding: "5px 11px", borderRadius: 20 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />Активен
                  </span>
                  <button onClick={() => deleteProject(p.id, p.name)} disabled={deletingId === p.id} style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", padding: 6, opacity: deletingId === p.id ? 0.4 : 1 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add project */}
        <div style={card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Подключить проект Bizon365</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Название проекта</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Мой вебинарный проект" />
            </div>
            <div>
              <label style={labelStyle}>ID проекта Bizon365</label>
              <input style={inputStyle} value={form.bizonId} onChange={(e) => setForm((f) => ({ ...f, bizonId: e.target.value }))} placeholder="175423" />
              <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--muted)" }}>Из URL: start.bizon365.ru/my/<b>XXXX</b>/project</p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>API Token</label>
              <input type="password" style={inputStyle} value={form.apiToken} onChange={(e) => setForm((f) => ({ ...f, apiToken: e.target.value }))} placeholder="Токен из Bizon ID → Безопасность" />
              <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--muted)" }}>Bizon365 → Биzon ID → Безопасность → API Token</p>
            </div>
          </div>
          <button onClick={createProject} disabled={creating || !form.name || !form.bizonId || !form.apiToken} style={{ marginTop: 18, cursor: "pointer", background: "var(--accent)", border: "none", borderRadius: 10, padding: "11px 20px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", opacity: (!form.name || !form.bizonId || !form.apiToken) ? 0.5 : 1 }}>
            {saved ? "Подключено ✓" : creating ? "Подключение..." : "Подключить"}
          </button>
        </div>

        {/* Users */}
        {isAdmin && (
          <div style={card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Пользователи</h3>
            {users.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Нет зарегистрированных пользователей</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {users.map((u) => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.telegramId;
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", border: "1px solid var(--border)", borderRadius: 12 }}>
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#6d5cff)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          {(name[0] ?? "?").toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{name}</div>
                        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>ID {u.telegramId}{u.username ? ` · @${u.username}` : ""}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: u.hasAccess ? "var(--green)" : "var(--red)", background: u.hasAccess ? "var(--greenbg)" : "var(--redbg)", padding: "4px 10px", borderRadius: 20 }}>
                          {u.hasAccess ? "Доступ" : "Нет доступа"}
                        </span>
                        {u.isAdmin && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "4px 10px", borderRadius: 20 }}>Админ</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[
                          { icon: u.hasAccess ? <UserX size={15} /> : <UserCheck size={15} />, title: u.hasAccess ? "Закрыть доступ" : "Открыть доступ", action: () => toggleAccess(u) },
                          { icon: u.isAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />, title: u.isAdmin ? "Убрать админа" : "Сделать админом", action: () => toggleAdmin(u) },
                          { icon: <Trash2 size={15} />, title: "Удалить", action: () => deleteUser(u) },
                        ].map((btn, i) => (
                          <button key={i} onClick={btn.action} disabled={updatingId === u.id} title={btn.title} style={{ padding: 6, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 6, opacity: updatingId === u.id ? 0.4 : 1 }}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
