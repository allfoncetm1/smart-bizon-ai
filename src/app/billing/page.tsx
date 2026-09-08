"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PlanKey = "MONTHLY" | "YEARLY";
type Method = "QR" | "PHONE";

interface PlanInfo {
  id: PlanKey;
  label: string;
  days: number;
  amount: number;
}

interface Invoice {
  id: string;
  status: string;
  method: Method;
  plan: PlanKey;
  amount: number;
  qrTokenUrl: string | null;
  qrImageUrl: string | null;
}

interface StatusResp {
  subscription: {
    status: string;
    accessVia: string;
    plan: PlanKey | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
  lastPayment: Invoice | null;
}

interface ConfigResp {
  payMethods: Method[];
  plans: Record<PlanKey, PlanInfo>;
}

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 1px 2px rgba(20,20,50,.04)",
};

function fmtDate(s: string | null): string {
  if (!s) return "";
  return new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(s: string | null): number {
  if (!s) return 0;
  return Math.max(0, Math.ceil((new Date(s).getTime() - Date.now()) / 86400000));
}

export default function BillingPage() {
  const [sub, setSub] = useState<StatusResp["subscription"]>(null);
  const [cfg, setCfg] = useState<ConfigResp | null>(null);
  const [plan, setPlan] = useState<PlanKey>("MONTHLY");
  const [method, setMethod] = useState<Method>("QR");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  function fetchStatus(): Promise<StatusResp | null> {
    return fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }

  useEffect(() => {
    let alive = true;
    fetchStatus().then((data) => {
      if (!alive || !data) return;
      setSub(data.subscription);
      if (data.lastPayment && data.lastPayment.status === "PENDING") setInvoice(data.lastPayment);
    });
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ConfigResp | null) => {
        if (!alive || !d) return;
        setCfg(d);
        if (d.payMethods.length && !d.payMethods.includes("QR")) setMethod(d.payMethods[0]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!invoice) return;
    const invoiceId = invoice.id;
    const timer = setInterval(async () => {
      const data = await fetchStatus();
      const lp = data?.lastPayment;
      if (!lp || lp.id !== invoiceId) return;
      if (lp.status === "PAID") {
        clearInterval(timer);
        await fetch("/api/auth/refresh").catch(() => {});
        window.location.href = "/";
      } else if (["CANCELLED", "EXPIRED", "ERROR"].includes(lp.status)) {
        clearInterval(timer);
        setInvoice(null);
        setError("Счёт отменён или просрочен. Создайте новый.");
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [invoice]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method, phone: method === "PHONE" ? phone : undefined }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(typeof data.error === "string" ? data.error : "Не удалось создать счёт");
        return;
      }
      setInvoice({
        id: data.paymentId,
        status: "PENDING",
        method,
        plan,
        amount: cfg?.plans[plan].amount ?? 0,
        qrTokenUrl: data.qrTokenUrl ?? null,
        qrImageUrl: data.qrImageUrl ?? null,
      });
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  const timed = sub?.accessVia === "TRIAL" || sub?.accessVia === "COMP";
  const timedActive = timed && !!sub?.trialEndsAt && new Date(sub.trialEndsAt) > new Date();
  const timedOver = timed && (!sub?.trialEndsAt || new Date(sub!.trialEndsAt) <= new Date());
  const paidActive = sub?.accessVia === "PAID" || sub?.accessVia === "ADMIN";
  const methods: Method[] = cfg?.payMethods.length ? cfg.payMethods : ["QR", "PHONE"];
  const showPicker = !invoice && (!paidActive || timedOver);
  const label = sub?.accessVia === "COMP" ? "Доступ" : "Пробный период";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
          Подписка на платформу
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--muted)" }}>
          Оплата через Kaspi. Продление — вручную: когда срок заканчивается, оплачиваете новый счёт.
        </p>
      </div>

      {sub && (
        <div
          style={{
            ...card,
            padding: "14px 18px",
            background: timedOver ? "var(--redbg)" : paidActive || timedActive ? "var(--greenbg)" : "var(--soft)",
            borderColor: timedOver
              ? "color-mix(in srgb, var(--red) 30%, transparent)"
              : paidActive || timedActive
              ? "color-mix(in srgb, var(--green) 30%, transparent)"
              : "var(--border)",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: timedOver ? "var(--red)" : paidActive || timedActive ? "var(--green)" : "var(--text)" }}>
            {paidActive && (sub.currentPeriodEnd ? `Подписка активна до ${fmtDate(sub.currentPeriodEnd)}` : "Доступ открыт")}
            {timedActive && `${label} — осталось ${daysLeft(sub.trialEndsAt)} дн. (до ${fmtDate(sub.trialEndsAt)})`}
            {timedOver && `${label} закончился — оплатите подписку, чтобы продолжить`}
          </span>
        </div>
      )}

      {invoice && (
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            К оплате {invoice.amount.toLocaleString("ru-RU")} ₸
          </div>
          {invoice.method === "QR" && invoice.qrImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invoice.qrImageUrl} alt="QR Kaspi" style={{ width: 220, height: 220, objectFit: "contain" }} />
          )}
          {invoice.method === "QR" && invoice.qrTokenUrl && (
            <a
              href={invoice.qrTokenUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 14, padding: "11px 20px", borderRadius: 10, textDecoration: "none" }}
            >
              Открыть в Kaspi
            </a>
          )}
          {invoice.method === "PHONE" && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
              Счёт отправлен в приложение Kaspi. Подтвердите оплату на телефоне.
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", animation: "sbPulse 2.2s infinite" }} />
            Ждём подтверждение оплаты…
          </div>
          <button
            onClick={() => { setInvoice(null); setError(null); }}
            style={{ border: "none", background: "transparent", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
          >
            Выбрать другой тариф
          </button>
        </div>
      )}

      {showPicker && cfg && (
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {(Object.keys(cfg.plans) as PlanKey[]).map((k) => {
              const p = cfg.plans[k];
              const active = plan === k;
              return (
                <button
                  key={k}
                  onClick={() => setPlan(k)}
                  style={{
                    flex: "1 1 200px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    borderRadius: 12,
                    padding: "14px 16px",
                    background: active ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--soft)",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{p.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>
                    {p.amount.toLocaleString("ru-RU")} ₸
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>на {p.days} дн.</div>
                </button>
              );
            })}
          </div>

          {methods.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 0",
                    borderRadius: 9,
                    background: method === m ? "var(--text)" : "var(--soft)",
                    color: method === m ? "#fff" : "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {m === "QR" ? "QR-код Kaspi" : "По номеру телефона"}
                </button>
              ))}
            </div>
          )}

          {method === "PHONE" && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="87071234567"
              inputMode="numeric"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "10px 12px",
                fontFamily: "inherit",
                fontSize: 14,
                color: "var(--text)",
                outline: "none",
              }}
            />
          )}

          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--redbg)", borderRadius: 9, padding: "9px 12px" }}>
              {error}
            </div>
          )}

          <button
            onClick={pay}
            disabled={busy}
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14.5,
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              cursor: busy ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Создаём счёт…" : `Оплатить ${cfg.plans[plan].amount.toLocaleString("ru-RU")} ₸`}
          </button>
        </div>
      )}

      {!invoice && paidActive && !timedOver && cfg && (
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            Доступ активен. Продлить можно в любой момент — новый период добавится к текущему.
          </div>
          <button
            onClick={pay}
            disabled={busy}
            style={{
              background: "var(--soft)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: 14,
              padding: "11px 0",
              borderRadius: 10,
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Продлить: {cfg.plans[plan].label} — {cfg.plans[plan].amount.toLocaleString("ru-RU")} ₸
          </button>
          <Link href="/" style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>← На дашборд</Link>
        </div>
      )}
    </div>
  );
}
