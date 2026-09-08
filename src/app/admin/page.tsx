"use client";

import { useEffect, useState } from "react";
import { Trash2, ShieldCheck, ShieldOff, UserCheck, UserX, Clock, Copy, Check } from "lucide-react";
import { TOGGLEABLE_SECTIONS } from "@/lib/plans";

interface Config {
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  sectionsOff: string[];
  payMethods: string[];
  apipayApiBase: string;
  apipayApiKey: string;
  apipayWebhookSecret: string;
}

interface Sub {
  status: string;
  accessVia: string;
  plan: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  phone: string | null;
}

interface AdminUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
  hasAccess: boolean;
  lastLoginAt: string | null;
  paymentsCount: number;
  subscription: Sub | null;
}

interface Payment {
  id: string;
  user: string;
  plan: string;
  method: string;
  amount: number;
  status: string;
  isSandbox: boolean;
  apipayInvoiceId: string | null;
  paidAt: string | null;
  createdAt: string;
}

const card: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" };
const h3: React.CSSProperties = { margin: "0 0 4px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" };
const sub: React.CSSProperties = { margin: "0 0 16px", fontSize: 12.5, color: "var(--muted)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontFamily: "inherit", fontSize: 14, color: "var(--text)", background: "var(--card)", outline: "none" };
const btn: React.CSSProperties = { cursor: "pointer", background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff" };

function fmt(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const ACCESS_LABEL: Record<string, string> = { TRIAL: "триал", PAID: "оплачено", ADMIN: "админ", COMP: "выдан вручную" };
const PAY_STATUS: Record<string, { t: string; c: string }> = {
  PAID: { t: "оплачен", c: "var(--green)" },
  PENDING: { t: "ждём", c: "var(--amber)" },
  CANCELLED: { t: "отменён", c: "var(--muted)" },
  EXPIRED: { t: "просрочен", c: "var(--muted)" },
  ERROR: { t: "ошибка", c: "var(--red)" },
  REFUNDED: { t: "возврат", c: "var(--red)" },
};

export default function AdminPage() {
  const [draft, setDraft] = useState<Config | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/payments/apipay/webhook` : "";

  function loadAll() {
    fetch("/api/admin/config").then((r) => r.json()).then((c) => { setDraft(c); }).catch(() => {});
    fetch("/api/admin/users").then((r) => (r.ok ? r.json() : [])).then(setUsers).catch(() => {});
    fetch("/api/admin/payments").then((r) => (r.ok ? r.json() : [])).then(setPayments).catch(() => {});
  }
  useEffect(loadAll, []);

  async function saveConfig(patch: Partial<Config>, key: string) {
    setBusyKey(key);
    try {
      const r = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        const c = await r.json();
        setDraft(c);
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1800);
      }
    } finally { setBusyKey(null); }
  }

  function toggleSection(k: string) {
    if (!draft) return;
    const next = draft.sectionsOff.includes(k) ? draft.sectionsOff.filter((s) => s !== k) : [...draft.sectionsOff, k];
    saveConfig({ sectionsOff: next }, "sections");
  }

  function toggleMethod(m: string) {
    if (!draft) return;
    const next = draft.payMethods.includes(m) ? draft.payMethods.filter((s) => s !== m) : [...draft.payMethods, m];
    if (next.length === 0) return;
    setDraft({ ...draft, payMethods: next });
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    setBusyKey(id);
    try {
      const r = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) loadAll();
    } finally { setBusyKey(null); }
  }

  async function deleteUser(u: AdminUser) {
    const name = u.firstName ?? u.username ?? u.telegramId;
    if (!confirm(`Удалить пользователя "${name}"? Его подписка и платежи тоже удалятся.`)) return;
    setBusyKey(u.id);
    try {
      const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      if (r.ok) setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } finally { setBusyKey(null); }
  }

  async function grant(u: AdminUser) {
    const raw = prompt(`Выдать доступ пользователю на сколько дней?`, "30");
    if (!raw) return;
    const days = parseInt(raw, 10);
    if (!Number.isFinite(days) || days < 1) return;
    setBusyKey(u.id);
    try {
      const r = await fetch(`/api/admin/users/${u.id}/grant`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days }),
      });
      if (r.ok) loadAll();
    } finally { setBusyKey(null); }
  }

  if (!draft) return <div style={{ color: "var(--muted)", fontSize: 14 }}>Загрузка…</div>;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Админка</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Доступ пользователей, подписки, платежи и настройки</p>
      </div>

      {/* Разделы сайта */}
      <div style={card}>
        <h3 style={h3}>Разделы сайта</h3>
        <p style={sub}>Отмеченные закрыты плашкой «Скоро» для всех, кроме админов {savedKey === "sections" && <b style={{ color: "var(--green)" }}>· сохранено</b>}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TOGGLEABLE_SECTIONS.map((s) => {
            const off = draft.sectionsOff.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSection(s.key)}
                disabled={busyKey === "sections"}
                style={{
                  cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 20,
                  border: `1.5px solid ${off ? "var(--amber)" : "var(--border)"}`,
                  background: off ? "var(--amberbg)" : "var(--soft)",
                  color: off ? "var(--amber)" : "var(--muted)",
                }}
              >
                {s.label} {off ? "· Скоро" : "· открыт"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Тарифы и триал */}
      <div style={card}>
        <h3 style={h3}>Тарифы и пробный период</h3>
        <p style={sub}>Суммы в тенге (целые). {savedKey === "plans" && <b style={{ color: "var(--green)" }}>Сохранено</b>}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            Месяц, ₸
            <input style={{ ...input, marginTop: 6 }} type="number" value={draft.monthlyPrice}
              onChange={(e) => setDraft({ ...draft, monthlyPrice: +e.target.value })} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            Год, ₸
            <input style={{ ...input, marginTop: 6 }} type="number" value={draft.yearlyPrice}
              onChange={(e) => setDraft({ ...draft, yearlyPrice: +e.target.value })} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            Триал, дней
            <input style={{ ...input, marginTop: 6 }} type="number" value={draft.trialDays}
              onChange={(e) => setDraft({ ...draft, trialDays: +e.target.value })} />
          </label>
        </div>
        <button style={btn} disabled={busyKey === "plans"}
          onClick={() => saveConfig({ monthlyPrice: draft.monthlyPrice, yearlyPrice: draft.yearlyPrice, trialDays: draft.trialDays }, "plans")}>
          {busyKey === "plans" ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      {/* Платёжная система */}
      <div style={card}>
        <h3 style={h3}>Платёжная система (ApiPay / Kaspi)</h3>
        <p style={sub}>Значения здесь перекрывают переменные окружения. {savedKey === "apipay" && <b style={{ color: "var(--green)" }}>Сохранено</b>}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>Webhook URL:</span>
          <code style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{webhookUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            API base URL
            <input style={{ ...input, marginTop: 6 }} value={draft.apipayApiBase} placeholder="https://api.apipay.kz/api/v1"
              onChange={(e) => setDraft({ ...draft, apipayApiBase: e.target.value })} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            X-API-Key
            <input style={{ ...input, marginTop: 6 }} type="password" value={draft.apipayApiKey} placeholder="оставьте пустым — брать из env"
              onChange={(e) => setDraft({ ...draft, apipayApiKey: e.target.value })} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            Webhook secret
            <input style={{ ...input, marginTop: 6 }} type="password" value={draft.apipayWebhookSecret} placeholder="оставьте пустым — брать из env"
              onChange={(e) => setDraft({ ...draft, apipayWebhookSecret: e.target.value })} />
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Способы оплаты на /billing</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["QR", "PHONE"].map((m) => {
              const on = draft.payMethods.includes(m);
              return (
                <button key={m} onClick={() => toggleMethod(m)}
                  style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 20,
                    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                    background: on ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--soft)",
                    color: on ? "var(--accent)" : "var(--muted)" }}>
                  {m === "QR" ? "QR-код" : "По телефону"} {on ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <button style={btn} disabled={busyKey === "apipay"}
          onClick={() => saveConfig({
            apipayApiBase: draft.apipayApiBase, apipayApiKey: draft.apipayApiKey,
            apipayWebhookSecret: draft.apipayWebhookSecret, payMethods: draft.payMethods,
          }, "apipay")}>
          {busyKey === "apipay" ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>

      {/* Пользователи */}
      <div style={card}>
        <h3 style={h3}>Пользователи ({users.length})</h3>
        <p style={sub}>Доступ, права, ручная выдача на срок</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.telegramId;
            const s = u.subscription;
            const until = s?.currentPeriodEnd ?? s?.trialEndsAt ?? null;
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#6d5cff)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {(name[0] ?? "?").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{name}{u.isAdmin && <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>АДМИН</span>}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    ID {u.telegramId}{u.username ? ` · @${u.username}` : ""} · платежей: {u.paymentsCount}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 120 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: u.hasAccess ? "var(--green)" : "var(--red)" }}>
                    {u.hasAccess ? "доступ" : "нет доступа"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {s ? `${ACCESS_LABEL[s.accessVia] ?? s.accessVia} · до ${fmt(until)}` : "нет подписки"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  {[
                    { icon: u.hasAccess ? <UserX size={15} /> : <UserCheck size={15} />, title: u.hasAccess ? "Закрыть доступ" : "Открыть доступ", fn: () => patchUser(u.id, { hasAccess: !u.hasAccess }) },
                    { icon: <Clock size={15} />, title: "Выдать на N дней", fn: () => grant(u) },
                    { icon: u.isAdmin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />, title: u.isAdmin ? "Убрать админа" : "Сделать админом", fn: () => patchUser(u.id, { isAdmin: !u.isAdmin }) },
                    { icon: <Trash2 size={15} />, title: "Удалить", fn: () => deleteUser(u) },
                  ].map((b, i) => (
                    <button key={i} onClick={b.fn} disabled={busyKey === u.id} title={b.title}
                      style={{ padding: 6, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 6, opacity: busyKey === u.id ? 0.4 : 1 }}>
                      {b.icon}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Платежи */}
      <div style={card}>
        <h3 style={h3}>Платежи ({payments.length})</h3>
        <p style={sub}>Последние 100 счетов ApiPay</p>
        {payments.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Платежей ещё не было</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Дата</th>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Пользователь</th>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Тариф</th>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Способ</th>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Сумма</th>
                  <th style={{ padding: "6px 8px", fontWeight: 600 }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const st = PAY_STATUS[p.status] ?? { t: p.status, c: "var(--muted)" };
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{fmt(p.createdAt)}</td>
                      <td style={{ padding: "8px", color: "var(--text)" }}>{p.user}</td>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{p.plan === "MONTHLY" ? "Месяц" : "Год"}</td>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{p.method === "QR" ? "QR" : "Телефон"}</td>
                      <td style={{ padding: "8px", color: "var(--text)" }}>{p.amount.toLocaleString("ru-RU")} ₸</td>
                      <td style={{ padding: "8px", color: st.c, fontWeight: 600 }}>{st.t}{p.isSandbox ? " (тест)" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
