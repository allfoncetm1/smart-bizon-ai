"use client";

import { useState, useEffect } from "react";

interface AgentConfig {
  id: string;
  isActive: boolean;
  moderationEnabled: boolean;
  filterSpam: boolean;
  filterMat: boolean;
  filterToxic: boolean;
  customBanWords: string[];
  autoAnswersEnabled: boolean;
  autoAnswerDelay: number;
  hotScoreThreshold: number;
  warmScoreThreshold: number;
  telegramEnabled: boolean;
  telegramChatId: string | null;
  notifyOnHotLead: boolean;
  notifyOnPurchase: boolean;
  productDescription: string | null;
  targetAudience: string | null;
  salesScript: string | null;
  customFaq: { question: string; answer: string }[] | null;
  googleSheetEnabled: boolean;
  googleSheetId: string | null;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{ position: "relative", width: 46, height: 26, borderRadius: 20, background: checked ? "var(--green)" : "var(--line)", border: "none", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
    >
      <span style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.25)", transition: "left 0.2s" }} />
    </button>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
      {title && <h3 style={{ margin: "0 0 16px", fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>{title}</h3>}
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{label}</p>
        {description && <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--muted)" }}>{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 14, color: "var(--text)", background: "var(--card)", outline: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const, minHeight: 74 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 7, color: "var(--text)" };

export default function AgentPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [banWordsInput, setBanWordsInput] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [chatIds, setChatIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        if (projects[0]) {
          setProjectId(projects[0].id);
          return fetch(`/api/agent/config?projectId=${projects[0].id}`);
        }
      })
      .then((r) => r?.json())
      .then((c) => {
        if (c) {
          setConfig(c);
          setBanWordsInput((c.customBanWords ?? []).join(", "));
          setChatIds(c.telegramChatId ? c.telegramChatId.split(",").map((s: string) => s.trim()).filter(Boolean) : [""]);
        }
      });
  }, []);

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function save() {
    if (!config || !projectId) return;
    setSaving(true);
    try {
      const validChatIds = chatIds.map((s) => s.trim()).filter(Boolean);
      const payload = {
        ...config,
        customBanWords: banWordsInput.split(",").map((w) => w.trim()).filter(Boolean),
        telegramChatId: validChatIds.join(","),
      };
      await fetch(`/api/agent/config?projectId=${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function addFaq() {
    if (!faqQuestion || !faqAnswer) return;
    update("customFaq", [...(config?.customFaq ?? []), { question: faqQuestion, answer: faqAnswer }]);
    setFaqQuestion(""); setFaqAnswer("");
  }

  if (!config) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted)", fontSize: 14 }}>Загрузка настроек агента...</div>;
  }

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Настройки AI Агента</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Настройте поведение агента под ваш вебинар</p>
        </div>
        <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", opacity: saving ? 0.7 : 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          {saved ? "Сохранено ✓" : saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Status */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Статус агента · <span style={{ color: config.isActive ? "var(--green)" : "var(--red)" }}>{config.isActive ? "Активен" : "Выключен"}</span></div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Включить или выключить AI обработку вебинаров</p>
          </div>
          <Toggle checked={config.isActive} onChange={(v) => update("isActive", v)} />
        </div>

        {/* Product */}
        <Card title="О вашем продукте">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div><label style={labelStyle}>Описание продукта</label><textarea style={textareaStyle} value={config.productDescription ?? ""} onChange={(e) => update("productDescription", e.target.value)} placeholder="Опишите ваш продукт или услугу…" /></div>
            <div><label style={labelStyle}>Целевая аудитория</label><textarea style={{ ...textareaStyle, minHeight: 60 }} value={config.targetAudience ?? ""} onChange={(e) => update("targetAudience", e.target.value)} placeholder="Кто ваши клиенты…" /></div>
            <div><label style={labelStyle}>Скрипт продаж / ключевые тезисы</label><textarea style={textareaStyle} value={config.salesScript ?? ""} onChange={(e) => update("salesScript", e.target.value)} placeholder="Ключевые преимущества, цена, оффер…" /></div>
          </div>
        </Card>

        {/* Segmentation */}
        <Card title="Сегментация лидов">
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { label: "Порог Горячего лида", key: "hotScoreThreshold" as const, color: "var(--red)" },
              { label: "Порог Тёплого лида", key: "warmScoreThreshold" as const, color: "var(--amber)" },
            ].map((item) => {
              const val = config[item.key] as number;
              return (
                <div key={item.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{val}</span>
                  </div>
                  <div style={{ position: "relative", height: 6, background: "var(--line)", borderRadius: 6, margin: "8px 0" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${val}%`, background: item.color, borderRadius: 6, pointerEvents: "none" }} />
                    <span style={{ position: "absolute", left: `${val}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2px solid ${item.color}`, boxShadow: "0 1px 3px rgba(0,0,0,.2)", display: "inline-block", pointerEvents: "none" }} />
                    <input type="range" min={0} max={100} value={val} onChange={(e) => update(item.key, parseInt(e.target.value))} style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", width: "100%", height: 26, opacity: 0, cursor: "pointer", margin: 0, padding: 0 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)" }}>
                    <span>0</span><span>100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Moderation */}
        <Card title="Модерация чата">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ToggleRow label="Включить модерацию" checked={config.moderationEnabled} onChange={(v) => update("moderationEnabled", v)} />
            {config.moderationEnabled && (
              <>
                <ToggleRow label="Фильтровать спам" checked={config.filterSpam} onChange={(v) => update("filterSpam", v)} />
                <ToggleRow label="Фильтровать мат и оскорбления" checked={config.filterMat} onChange={(v) => update("filterMat", v)} />
                <ToggleRow label="Фильтровать токсичные сообщения" checked={config.filterToxic} onChange={(v) => update("filterToxic", v)} />
                <div>
                  <label style={labelStyle}>Запрещённые слова (через запятую)</label>
                  <input style={inputStyle} value={banWordsInput} onChange={(e) => setBanWordsInput(e.target.value)} placeholder="слово1, слово2, слово3" />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Auto answers */}
        <Card title="Автоматические ответы">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ToggleRow label="Генерировать ответы на вопросы" description="AI будет анализировать вопросы и готовить ответы" checked={config.autoAnswersEnabled} onChange={(v) => update("autoAnswersEnabled", v)} />
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>База FAQ (вопрос-ответ)</p>
              {(config.customFaq ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, background: "var(--soft)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 12.5, color: "var(--accent)", margin: "0 0 4px" }}>Q: {item.question}</p>
                    <p style={{ fontSize: 12.5, color: "var(--text)", margin: 0 }}>A: {item.answer}</p>
                  </div>
                  <button onClick={() => update("customFaq", (config.customFaq ?? []).filter((_, idx) => idx !== i))} style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", padding: "0 8px", fontSize: 16 }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                <input style={inputStyle} value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} placeholder="Вопрос..." />
                <input style={inputStyle} value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} placeholder="Ответ..." />
                <button onClick={addFaq} disabled={!faqQuestion || !faqAnswer} style={{ alignSelf: "flex-start", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 16px", fontFamily: "inherit", fontSize: 13, color: "var(--accent)", fontWeight: 600, cursor: "pointer", opacity: (!faqQuestion || !faqAnswer) ? 0.4 : 1 }}>+ Добавить</button>
              </div>
            </div>
          </div>
        </Card>

        {/* Telegram */}
        <Card title="Telegram уведомления">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ToggleRow label="Включить Telegram уведомления" checked={config.telegramEnabled} onChange={(v) => update("telegramEnabled", v)} />
            {config.telegramEnabled && (
              <>
                <div>
                  <label style={labelStyle}>Chat ID получателей</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {chatIds.map((id, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          value={id}
                          onChange={(e) => setChatIds((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                          placeholder="-100123456789"
                        />
                        {chatIds.length > 1 && (
                          <button
                            onClick={() => setChatIds((prev) => prev.filter((_, j) => j !== i))}
                            style={{ padding: "0 14px", background: "var(--redbg)", border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)", borderRadius: 10, color: "var(--red)", cursor: "pointer", fontSize: 18, fontWeight: 400, flexShrink: 0 }}
                          >×</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setChatIds((prev) => [...prev, ""])}
                      style={{ alignSelf: "flex-start", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
                    >+ Добавить Chat ID</button>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>Узнать свой Chat ID можно через @userinfobot в Telegram</p>
                </div>
                <ToggleRow label="Уведомлять о горячих лидах" checked={config.notifyOnHotLead} onChange={(v) => update("notifyOnHotLead", v)} />
              </>
            )}
          </div>
        </Card>

        {/* Google Sheets */}
        <Card title="Google Таблица">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5, flex: 1, marginRight: 16 }}>После каждого анализа вебинара новые горячие и тёплые лиды добавляются в таблицу.</p>
            <Toggle checked={config.googleSheetEnabled} onChange={(v) => update("googleSheetEnabled", v)} />
          </div>
          {config.googleSheetEnabled && (
            <>
              <label style={labelStyle}>ID Google Таблицы</label>
              <input style={{ ...inputStyle, fontSize: 13, fontFeatureSettings: "'tnum' 1" }} value={config.googleSheetId ?? ""} onChange={(e) => update("googleSheetId", e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>Из URL таблицы: docs.google.com/spreadsheets/d/<b>ID</b>/edit</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
