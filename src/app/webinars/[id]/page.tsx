"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

const segmentBadge: Record<string, string> = {
  HOT: "bg-red-500/10 text-red-400 border border-red-500/20",
  WARM: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  COLD: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

const segmentEmoji: Record<string, string> = {
  HOT: "🔥", WARM: "⚡", COLD: "❄️",
};

type Tab = "overview" | "chat" | "questions" | "leads";

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
    fetch(`/api/webinars/${id}`)
      .then((r) => r.json())
      .then(setWebinar);
  }, [id]);

  if (!webinar) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/webinars" className="text-gray-400 hover:text-white mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{webinar.title}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date(webinar.createdAt).toLocaleDateString("ru-RU")} · {webinar.viewersCount} зрителей
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(["overview", "chat", "questions", "leads"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            {t === "overview" && "Обзор"}
            {t === "chat" && `Чат (${webinar.chatMessages.length})`}
            {t === "questions" && `Вопросы (${questions.length})`}
            {t === "leads" && `Участники (${webinar.participants.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Зрителей", value: a?.totalViewers ?? 0, icon: "👥" },
              { label: "Сообщений", value: a?.chatMessagesCount ?? 0, icon: "💬" },
              { label: "Горячих", value: a?.hotLeadsCount ?? 0, icon: "🔥" },
              { label: "Тёплых", value: a?.warmLeadsCount ?? 0, icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Stats row 2 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Спам / Токсичность</p>
              <p className="text-lg font-bold text-red-400">{a?.spamCount ?? 0} сообщений</p>
              <p className="text-xs text-gray-500 mt-1">удалено AI модератором</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Вопросы участников</p>
              <p className="text-lg font-bold text-blue-400">{a?.questionsCount ?? 0} вопросов</p>
              <p className="text-xs text-gray-500 mt-1">обработано AI агентом</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Конверсия</p>
              <p className="text-lg font-bold text-green-400">{a?.conversionRate.toFixed(1) ?? 0}%</p>
              <p className="text-xs text-gray-500 mt-1">зрителей → горячий лид</p>
            </div>
          </div>

          {/* Сегменты */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Сегментация</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Горячие", value: a?.hotLeadsCount ?? 0, emoji: "🔥", color: "text-red-400" },
                { label: "Тёплые", value: a?.warmLeadsCount ?? 0, emoji: "⚡", color: "text-yellow-400" },
                { label: "Холодные", value: a?.coldLeadsCount ?? 0, emoji: "❄️", color: "text-blue-400" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 bg-gray-800 rounded-lg">
                  <p className="text-2xl mb-1">{s.emoji}</p>
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {a?.summary && (
            <div className="bg-gray-900 border border-violet-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <p className="font-semibold text-white">AI Резюме</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{a.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "Все" },
              { key: "questions", label: `❓ Вопросы (${questions.length})` },
              { key: "spam", label: `🚫 Спам (${a?.spamCount ?? 0})` },
              { key: "toxic", label: "☠️ Токсичные" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setChatFilter(f.key as typeof chatFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  chatFilter === f.key
                    ? "bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-800">
              {filteredMessages.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Нет сообщений</p>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "px-4 py-3 flex gap-3",
                      msg.isSpam || msg.isToxic ? "bg-red-500/5" : msg.isQuestion ? "bg-violet-500/5" : ""
                    )}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                      {(msg.senderName?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-300">{msg.senderName ?? "Аноним"}</span>
                        {msg.isSpam && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">спам</span>}
                        {msg.isToxic && <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">токсик</span>}
                        {msg.isQuestion && <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">вопрос</span>}
                        <span className="text-xs text-gray-600 ml-auto">
                          {new Date(msg.sentAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200">{msg.text}</p>
                      {msg.aiAnswer && (
                        <div className="mt-2 pl-3 border-l-2 border-violet-500">
                          <p className="text-xs text-violet-400">🤖 AI ответ:</p>
                          <p className="text-sm text-gray-300">{msg.aiAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {tab === "questions" && (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
              Вопросов не обнаружено
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-violet-400">{q.senderName ?? "Аноним"}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(q.sentAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-white">{q.text}</p>
                {q.aiAnswer && (
                  <div className="mt-3 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <p className="text-xs text-violet-400 mb-1">🤖 Ответ AI агента:</p>
                    <p className="text-sm text-gray-200">{q.aiAnswer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Participants */}
      {tab === "leads" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Участник</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Сегмент</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Балл</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Время</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Страна</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">AI карточка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {webinar.participants.flatMap((p) => {
                const card = leadCards[p.email];
                const isExpanded = expandedParticipant === p.id;

                const mainRow = (
                  <tr
                    key={p.id}
                    onClick={async () => {
                      if (isExpanded) { setExpandedParticipant(null); return; }
                      setExpandedParticipant(p.id);
                      if (!leadsLoaded) {
                        const res = await fetch(`/api/leads?webinarId=${id}&page=1`);
                        const data = await res.json();
                        const map: Record<string, ParticipantLead> = {};
                        for (const lead of data.leads ?? []) {
                          map[lead.email] = {
                            painPoints: lead.painPoints ?? [],
                            objections: lead.objections ?? [],
                            openingPhrase: lead.openingPhrase ?? null,
                            recommendedProduct: lead.recommendedProduct ?? null,
                            aiCardAt: lead.aiCardAt ?? null,
                            chatMessages: lead.chatMessages ?? [],
                          };
                        }
                        setLeadCards(map);
                        setLeadsLoaded(true);
                      }
                    }}
                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{p.name ?? p.email}</p>
                      {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full", segmentBadge[p.segment])}>
                        {segmentEmoji[p.segment]} {p.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full",
                              p.score >= 70 ? "bg-red-500" : p.score >= 40 ? "bg-yellow-500" : "bg-blue-500"
                            )}
                            style={{ width: `${p.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-white">{p.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{Math.round(p.timeOnWebinar / 60)} мин</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{p.country ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {card?.aiCardAt
                          ? <span className="text-xs text-violet-400 font-medium">🤖 Есть</span>
                          : <span className="text-xs text-gray-600">—</span>
                        }
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        }
                      </div>
                    </td>
                  </tr>
                );

                if (!isExpanded) return [mainRow];

                const cardRow = (
                  <tr key={`${p.id}-card`}>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-950 border-t border-gray-800">
                        {/* Сообщения в чате */}
                        {card && card.chatMessages.length > 0 && (
                          <div className="px-5 py-4 border-b border-gray-800">
                            <p className="text-xs font-semibold text-gray-400 mb-2.5">
                              💬 Писал в чате ({card.chatMessages.length})
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {card.chatMessages.map((msg, i) => (
                                <div key={i} className="flex items-start gap-2 bg-gray-900 rounded-lg px-3 py-2">
                                  <span className="text-xs text-gray-600 mt-0.5 shrink-0">{i + 1}.</span>
                                  <p className="text-sm text-gray-200 leading-relaxed">{msg}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI карточка */}
                        {!card || !card.aiCardAt ? (
                          <div className="px-5 py-4">
                            <p className="text-xs text-gray-500">
                              {!card ? "AI-карточка не сгенерирована для этого участника." : "Участник вне топ-30 по баллу — карточка не создавалась."}
                            </p>
                          </div>
                        ) : (
                          <div className="px-5 py-4 grid grid-cols-2 gap-4">
                            {card.painPoints.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-2">🎯 Боли</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {card.painPoints.map((pt, i) => (
                                    <span key={i} className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded-full">{pt}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {card.objections.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 mb-2">⚠️ Возражения</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {card.objections.map((obj, i) => (
                                    <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">{obj}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {card.openingPhrase && (
                              <div className="col-span-2">
                                <p className="text-xs font-semibold text-gray-400 mb-2">📞 Первая фраза</p>
                                <div className="flex items-start gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2.5">
                                  <p className="text-sm text-violet-200 flex-1 leading-relaxed">{card.openingPhrase}</p>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await navigator.clipboard.writeText(card.openingPhrase!);
                                      setCopiedPhrase(p.id);
                                      setTimeout(() => setCopiedPhrase(null), 2000);
                                    }}
                                    className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-violet-400 transition-colors"
                                  >
                                    {copiedPhrase === p.id
                                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                                      : <Copy className="w-3.5 h-3.5" />
                                    }
                                  </button>
                                </div>
                              </div>
                            )}
                            {card.recommendedProduct && (
                              <div className="col-span-2">
                                <p className="text-xs font-semibold text-gray-400 mb-2">🛍️ Рекомендовать</p>
                                <span className="text-xs bg-green-500/10 text-green-300 border border-green-500/20 px-3 py-1.5 rounded-lg inline-block">
                                  {card.recommendedProduct}
                                </span>
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
