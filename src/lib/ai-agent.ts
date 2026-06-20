import Anthropic from "@anthropic-ai/sdk";
import type { BizonChatMessage } from "./bizon365";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatModerationResult {
  isSpam: boolean;
  isToxic: boolean;
  isQuestion: boolean;
  reason?: string;
}

export interface LeadScore {
  score: number;
  segment: "HOT" | "WARM" | "COLD" | "PURCHASED";
  reasoning: string;
  recommendedAction: string;
}

export interface WebinarSummary {
  summary: string;
  topQuestions: string[];
  mainObjections: string[];
  recommendations: string[];
}

export async function moderateChatMessages(
  messages: BizonChatMessage[],
  banWords: string[] = []
): Promise<(ChatModerationResult & { text: string })[]> {
  // Фильтруем сообщения без текста
  const validMessages = messages.filter((m) => m.text && m.text.trim().length > 0);
  if (validMessages.length === 0) return [];

  const messageList = validMessages
    .map((m, i) => `${i + 1}. "${m.text}"`)
    .join("\n");

  const banWordsNote =
    banWords.length > 0
      ? `\nДополнительные запрещённые слова: ${banWords.join(", ")}`
      : "";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Проанализируй сообщения чата вебинара. Для каждого определи:
- isSpam: является ли рекламой или спамом
- isToxic: содержит ли мат, оскорбления, токсичность
- isQuestion: является ли вопросом к спикеру${banWordsNote}

Верни JSON массив в точном формате:
[{"index": 1, "isSpam": false, "isToxic": false, "isQuestion": true, "reason": "причина только если spam или toxic"}]

Сообщения:
${messageList}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const results: {
      index: number;
      isSpam: boolean;
      isToxic: boolean;
      isQuestion: boolean;
      reason?: string;
    }[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return validMessages.map((msg, i) => {
      const result = results.find((r) => r.index === i + 1);
      return {
        text: msg.text ?? "",
        isSpam: result?.isSpam ?? false,
        isToxic: result?.isToxic ?? false,
        isQuestion: result?.isQuestion ?? false,
        reason: result?.reason,
      };
    });
  } catch {
    return validMessages.map((msg) => ({
      text: msg.text ?? "",
      isSpam: false,
      isToxic: false,
      isQuestion: false,
    }));
  }
}

export async function generateAutoAnswer(
  question: string,
  context: {
    productDescription?: string;
    targetAudience?: string;
    salesScript?: string;
    faq?: { question: string; answer: string }[];
  }
): Promise<string> {
  const faqText =
    context.faq && context.faq.length > 0
      ? `\nЧасто задаваемые вопросы:\n${context.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`
      : "";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Ты помощник на вебинаре. Дай краткий, конкретный ответ на вопрос участника.

Продукт: ${context.productDescription ?? "не указан"}
Целевая аудитория: ${context.targetAudience ?? "не указана"}${faqText}

Вопрос участника: "${question}"

Правила:
- Ответ не более 3 предложений
- Дружелюбный тон
- Если не знаешь ответа — скажи что спикер ответит лично
- Не придумывай факты о продукте`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Спасибо за вопрос! Спикер ответит на него в ближайшее время.";
}

export interface ViewerForScoring {
  email: string;
  timeOnWebinar: number;
  messagesCount: number;
  clickedButtons: number;
  hasOrder: boolean;
  country?: string;
}

export async function scoreLeads(
  viewers: ViewerForScoring[],
  config: {
    hotThreshold: number;
    warmThreshold: number;
    productDescription?: string;
  }
): Promise<(LeadScore & { email: string })[]> {
  if (viewers.length === 0) return [];

  const viewersData = viewers.map((v) => ({
    email: v.email,
    timeOnWebinar: v.timeOnWebinar,
    messagesCount: v.messagesCount,
    clickedButtons: v.clickedButtons,
    hasOrder: v.hasOrder,
    country: v.country,
  }));

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Оцени потенциал каждого участника вебинара как лида (0-100).

Продукт: ${config.productDescription ?? "не указан"}

Критерии оценки:
- Время на вебинаре (дольше = выше оценка)
- Количество сообщений в чате (активность)
- Клики на кнопки/баннеры
- Наличие заказа (автоматически 100 = PURCHASED)

Пороги сегментов:
- HOT: ${config.hotThreshold}+
- WARM: ${config.warmThreshold}-${config.hotThreshold - 1}
- COLD: 0-${config.warmThreshold - 1}

Данные участников (JSON):
${JSON.stringify(viewersData, null, 2)}

Верни JSON массив:
[{"email": "...", "score": 85, "segment": "HOT", "reasoning": "кратко", "recommendedAction": "что делать"}]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return viewers.map((v) => ({
      email: v.email,
      score: 0,
      segment: "COLD" as const,
      reasoning: "Ошибка анализа",
      recommendedAction: "Повторить анализ",
    }));
  }
}

export interface LeadCard {
  painPoints: string[];
  objections: string[];
  openingPhrase: string;
  recommendedProduct: string;
}

interface ParticipantForCard {
  identifier: string;
  name?: string;
  timeOnWebinar: number;
  segment: string;
  score: number;
  chatMessages: string[];
  clickedButtons: number;
  country?: string;
}

export async function generateLeadCards(
  participants: ParticipantForCard[],
  context: {
    webinarTitle: string;
    productDescription?: string;
  }
): Promise<Record<string, LeadCard>> {
  if (participants.length === 0) return {};

  const participantsData = participants.map((p) => ({
    id: p.identifier,
    name: p.name ?? "Участник",
    timeOnWebinar: `${Math.round(p.timeOnWebinar / 60)} мин`,
    segment: p.segment,
    score: p.score,
    chatMessages: p.chatMessages.slice(0, 10),
    clickedButtons: p.clickedButtons,
    country: p.country ?? null,
  }));

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Ты опытный менеджер по продажам. Проанализируй каждого участника вебинара и создай персональную карточку лида для отдела продаж.

Вебинар: "${context.webinarTitle}"
Продукт: ${context.productDescription ?? "не указан"}

Участники (JSON):
${JSON.stringify(participantsData, null, 2)}

Правила:
- Опирайся ТОЛЬКО на реальные данные (сообщения, поведение). Не придумывай то, чего нет.
- Боли — что беспокоит человека, исходя из его вопросов и поведения
- Возражения — наиболее вероятные причины отказа от покупки
- Открывашка — живая первая фраза для звонка, персонализированная под этого конкретного человека
- Продукт — конкретный тариф/продукт, который подходит этому человеку

Верни ТОЛЬКО JSON объект (ключ = id участника):
{
  "<id>": {
    "painPoints": ["боль 1", "боль 2"],
    "objections": ["возражение 1", "возражение 2"],
    "openingPhrase": "Готовая фраза для начала звонка (1-2 предложения)",
    "recommendedProduct": "название продукта или тариф"
  }
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    return {};
  }
}

export async function generateWebinarSummary(
  data: {
    title: string;
    duration: number;
    viewersCount: number;
    messages: BizonChatMessage[];
    hotLeadsCount: number;
    purchasesCount: number;
  },
  productDescription?: string
): Promise<WebinarSummary> {
  const questions = data.messages
    .filter((m) => m.text?.includes("?"))
    .slice(0, 30)
    .map((m) => m.text ?? "")
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Создай краткое резюме вебинара для команды продаж.

Вебинар: "${data.title}"
Продукт: ${productDescription ?? "не указан"}
Длительность: ${data.duration} мин
Зрителей: ${data.viewersCount}
Горячих лидов: ${data.hotLeadsCount}
Покупок: ${data.purchasesCount}

Сообщения чата (вопросы):
${questions || "нет вопросов"}

Верни JSON:
{
  "summary": "2-3 предложения о прошедшем вебинаре",
  "topQuestions": ["топ-5 самых частых вопросов"],
  "mainObjections": ["главные возражения аудитории"],
  "recommendations": ["рекомендации для следующего вебинара"]
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          summary: "Анализ недоступен",
          topQuestions: [],
          mainObjections: [],
          recommendations: [],
        };
  } catch {
    return {
      summary: "Ошибка анализа",
      topQuestions: [],
      mainObjections: [],
      recommendations: [],
    };
  }
}
