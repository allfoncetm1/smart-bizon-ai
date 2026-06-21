"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  text: string;
  senderName: string | null;
  sentAt: string;
  isSpam: boolean;
  isToxic: boolean;
  isQuestion: boolean;
  aiAnswer: string | null;
}

interface Participant {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  segment: string;
  score: number;
  timeOnWebinar: number;
  country: string | null;
}

interface ParticipantLead {
  painPoints: string[];
  objections: string[];
  openingPhrase: string | null;
  recommendedProduct: string | null;
  aiCardAt: string | null;
  chatMessages: string[];
}

interface Analytics {
  totalViewers: number;
  chatMessagesCount: number;
  spamCount: number;
  questionsCount: number;
  hotLeadsCount: number;
  warmLeadsCount: number;
  coldLeadsCount: number;
  purchasesCount: number;
  conversionRate: number;
  summary: string | null;
}

interface Webinar {
  id: string;
  title: string;
  status: string;
  viewersCount: number;
  createdAt: string;
  analytics: Analytics | null;
  chatMessages: ChatMessage[];
  participants: Participant[];
}

const segmentColors: Record<string, { color: string; bg: string; dot: string }> = {
  HOT: { color: "var(--red)", bg: "var(--redbg)", dot: "var(--red)" },
  WARM: { color: "var(--amber)", bg: "var(--amberbg)", dot: "var(--amber)" },
  COLD: { color: "var(--blue)", bg: "var(--bluebg)", dot: "var(--blue)" },
};

const segmentEmoji: Record<string, string> = { HOT: "🔥", WARM: "⚡", COLD: "❄️" };

type Tab = "overview" | "chat" | "questions" | "leads";

const card: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(20,20,50,.04)" };

export default function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [chatFilter, setChatFilter] = useState<"all" | "spam" | "toxic" | "questions">("all");
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [leadCards, setLeadCards] = useState<Record<string, ParticipantLead>>({});
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/webinars/${id}`).then((r) => r.json()).then(setWebinar);
  }, [id]);

  if (!webinar) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted)", fontSize: 14 }}>Загрузка...</div>;
  }

  const a = webinar.analytics;
  const filteredMessages = webinar.chatMessages.filter((m) => {
    if (chatFilter === "spam") return m.isSpam;
    if (chatFilter === "toxic") return m.isToxic;
    if (chatFilter === "questions") return m.isQuestion;
    return true;
  });
  const questions = webinar.chatMessages.filter((m) => m.isQuestion);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 22 }}>
        <Link href="/webinars" style={{ color: "var(--muted)", marginTop: 2, flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{webinar.title}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{new Date(webinar.createdAt).toLocaleDateString("ru-RU")} · {webinar.viewersCount} зрителей</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 11, padding: 4, width: "fit-content", marginBottom: 22 }}>
        {(["overview", "chat", "questions", "leads"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: tab === t ? 600 : 500, border: "none", cursor: "pointer", fontFamily: "inherit", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#fff" : "var(--muted)", transition: "all 0.15s" }}>
            {t === "overview" && "Обзор"}
            {t === "chat" && `Чат (${webinar.chatMessages.length})`}
            {t === "questions" && `Вопросы (${questions.length})`}
            {t === "leads" && `Участники (${webinar.participants.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Зрителей", value: a?.totalViewers ?? 0, icon: "👥" },
              { label: "Сообщений", value: a?.chatMessagesCount ?? 0, icon: "💬" },
              { label: "Горячих", value: a?.hotLeadsCount ?? 0, icon: "🔥" },
              { label: "Тёплых", value: a?.warmLeadsCount ?? 0, icon: "⚡" },
            ].map((s) => (
              <div key={s.label} style={card}>
                <p style={{ fontSize: 22, margin: "0 0 6px" }}>{s.icon}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div style={card}><p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>Спам / Токсичность</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--red)", margin: "0 0 2px" }}>{a?.spamCount ?? 0} сообщений</p><p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>удалено AI модератором</p></div>
            <div style={card}><p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>Вопросы участников</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)", margin: "0 0 2px" }}>{a?.questionsCount ?? 0} вопросов</p><p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>обработано AI агентом</p></div>
            <div style={card}><p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>Конверсия</p><p style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", margin: "0 0 2px" }}>{a?.conversionRate.toFixed(1) ?? 0}%</p><p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>зрителей → горячий лид</p></div>
          </div>
          <div style={card}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 14px" }}>Сегментация</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Горячие", value: a?.hotLeadsCount ?? 0, emoji: "🔥", color: "var(--red)" },
                { label: "Тёплые", value: a?.warmLeadsCount ?? 0, emoji: "⚡", color: "var(--amber)" },
                { label: "Холодные", value: a?.coldLeadsCount ?? 0, emoji: "❄️", color: "var(--blue)" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: 12, background: "var(--soft)", borderRadius: 10 }}>
                  <p style={{ fontSize: 22, margin: "0 0 4px" }}>{s.emoji}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {a?.summary && (
            <div style={{ background: "color-mix(in srgb, var(--accent) 7%, var(--card))", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", margin: 0 }}>AI Резюме</p>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{a.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "all", label: "Все" },
              { key: "questions", label: `❓ Вопросы (${questions.length})` },
              { key: "spam", label: `🚫 Спам (${a?.spamCount ?? 0})` },
              { key: "toxic", label: "☠️ Токсичные" },
            ].map((f) => (
              <button key={f.key} onClick={() => setChatFilter(f.key as typeof chatFilter)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: chatFilter === f.key ? 600 : 500, border: "none", cursor: "pointer", fontFamily: "inherit", background: chatFilter === f.key ? "var(--accent)" : "var(--soft)", color: chatFilter === f.key ? "#fff" : "var(--muted)", transition: "all 0.15s" }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {filteredMessages.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 24px", fontSize: 14 }}>Нет сообщений</p>
              ) : filteredMessages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--line)", background: msg.isSpam || msg.isToxic ? "color-mix(in srgb, var(--red) 4%, transparent)" : msg.isQuestion ? "color-mix(in srgb, var(--accent) 4%, transparent)" : "transparent" }}>
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                    {(msg.senderName?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{msg.senderName ?? "Аноним"}</span>
                      {msg.isSpam && <span style={{ fontSize: 11, background: "var(--redbg)", color: "var(--red)", padding: "1px 7px", borderRadius: 10 }}>спам</span>}
                      {msg.isToxic && <span style={{ fontSize: 11, background: "var(--amberbg)", color: "var(--amber)", padding: "1px 7px", borderRadius: 10 }}>токсик</span>}
                      {msg.isQuestion && <span style={{ fontSize: 11, background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", padding: "1px 7px", borderRadius: 10 }}>вопрос</span>}
                      <span style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: "auto" }}>{new Date(msg.sentAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                    {msg.aiAnswer && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid var(--accent)" }}>
                        <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 3px" }}>🤖 AI ответ:</p>
                        <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{msg.aiAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {tab === "questions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {questions.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: "48px 24px", color: "var(--muted)", fontSize: 14 }}>Вопросов не обнаружено</div>
          ) : questions.map((q) => (
            <div key={q.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)" }}>{q.senderName ?? "Аноним"}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(q.sentAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{q.text}</p>
              {q.aiAnswer && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "color-mix(in srgb, var(--accent) 8%, transparent)", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
                  <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 4px" }}>🤖 Ответ AI агента:</p>
                  <p style={{ fontSize: 13.5, color: "var(--text)", margin: 0 }}>{q.aiAnswer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Participants */}
      {tab === "leads" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Участник", "Сегмент", "Балл", "Время", "Страна", "AI карточка"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a3a2b0", padding: "15px 16px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webinar.participants.flatMap((p) => {
                const lcard = leadCards[p.email];
                const isExpanded = expandedParticipant === p.id;
                const seg = segmentColors[p.segment] ?? { color: "var(--muted)", bg: "var(--soft)", dot: "var(--muted)" };

                const mainRow = (
                  <tr key={p.id} onClick={async () => {
                    if (isExpanded) { setExpandedParticipant(null); return; }
                    setExpandedParticipant(p.id);
                    if (!leadsLoaded) {
                      const res = await fetch(`/api/leads?webinarId=${id}&page=1`);
                      const data = await res.json();
                      const map: Record<string, ParticipantLead> = {};
                      for (const lead of data.leads ?? []) {
                        map[lead.email] = { painPoints: lead.painPoints ?? [], objections: lead.objections ?? [], openingPhrase: lead.openingPhrase ?? null, recommendedProduct: lead.recommendedProduct ?? null, aiCardAt: lead.aiCardAt ?? null, chatMessages: lead.chatMessages ?? [] };
                      }
                      setLeadCards(map);
                      setLeadsLoaded(true);
                    }
                  }} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>{p.name ?? p.email}</p>
                      {p.phone && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{p.phone}</p>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: seg.color, background: seg.bg, padding: "3px 9px", borderRadius: 20 }}>
                        {segmentEmoji[p.segment]} {p.segment}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: "var(--line)", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ height: 6, borderRadius: 6, width: `${p.score}%`, background: p.score >= 70 ? "var(--red)" : p.score >= 40 ? "var(--amber)" : "var(--blue)" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{Math.round(p.timeOnWebinar / 60)} мин</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted)" }}>{p.country ?? "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {lcard?.aiCardAt ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>🤖 Есть</span> : <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>}
                        {isExpanded ? <ChevronUp size={13} color="var(--muted)" /> : <ChevronDown size={13} color="var(--muted)" />}
                      </div>
                    </td>
                  </tr>
                );

                if (!isExpanded) return [mainRow];

                const cardRow = (
                  <tr key={`${p.id}-card`}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div style={{ background: "var(--soft)", borderTop: "1px solid var(--border)" }}>
                        {lcard && lcard.chatMessages.length > 0 && (
                          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 10px" }}>💬 Писал в чате ({lcard.chatMessages.length})</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {lcard.chatMessages.map((msg, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "var(--card)", borderRadius: 8, padding: "8px 12px" }}>
                                  <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>{msg}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!lcard || !lcard.aiCardAt ? (
                          <div style={{ padding: "16px 20px" }}>
                            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>{!lcard ? "AI-карточка не сгенерирована для этого участника." : "Участник вне топ-30 по баллу — карточка не создавалась."}</p>
                          </div>
                        ) : (
                          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {lcard.painPoints.length > 0 && (
                              <div><p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 8px" }}>🎯 Боли</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{lcard.painPoints.map((pt, i) => <span key={i} style={{ fontSize: 12, background: "var(--amberbg)", color: "var(--amber)", padding: "2px 8px", borderRadius: 20 }}>{pt}</span>)}</div></div>
                            )}
                            {lcard.objections.length > 0 && (
                              <div><p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 8px" }}>⚠️ Возражения</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{lcard.objections.map((obj, i) => <span key={i} style={{ fontSize: 12, background: "var(--redbg)", color: "var(--red)", padding: "2px 8px", borderRadius: 20 }}>{obj}</span>)}</div></div>
                            )}
                            {lcard.openingPhrase && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 8px" }}>📞 Первая фраза</p>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 10, padding: "10px 12px" }}>
                                  <p style={{ fontSize: 13.5, color: "var(--text)", flex: 1, lineHeight: 1.5, margin: 0 }}>{lcard.openingPhrase}</p>
                                  <button onClick={async (e) => { e.stopPropagation(); await navigator.clipboard.writeText(lcard.openingPhrase!); setCopiedPhrase(p.id); setTimeout(() => setCopiedPhrase(null), 2000); }} style={{ flexShrink: 0, padding: 4, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                                    {copiedPhrase === p.id ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                                  </button>
                                </div>
                              </div>
                            )}
                            {lcard.recommendedProduct && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 8px" }}>🛍️ Рекомендовать</p>
                                <span style={{ fontSize: 12, background: "var(--greenbg)", color: "var(--green)", padding: "5px 12px", borderRadius: 8 }}>{lcard.recommendedProduct}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );

                return [mainRow, cardRow];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
