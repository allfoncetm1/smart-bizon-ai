const TELEGRAM_API = "https://api.telegram.org";

async function sendMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    console.error("Telegram error for chatId", chatId, await res.text());
  }
}

function parseChatIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
}

async function broadcast(botToken: string, chatIdRaw: string | null | undefined, text: string) {
  const ids = parseChatIds(chatIdRaw);
  await Promise.all(ids.map((id) => sendMessage(botToken, id, text)));
}

export async function notifyHotLead(params: {
  botToken: string;
  chatId: string | null | undefined;
  webinarTitle: string;
  name?: string;
  phone?: string;
  score: number;
  action: string;
}) {
  const text = [
    `🔥 <b>Горячий лид!</b>`,
    ``,
    `📺 Вебинар: <b>${params.webinarTitle}</b>`,
    `👤 Имя: ${params.name ?? "не указано"}`,
    `📞 Телефон: ${params.phone ?? "не указан"}`,
    `⭐ Балл: <b>${params.score}/100</b>`,
    ``,
    `✅ Рекомендация: ${params.action}`,
  ].join("\n");

  await broadcast(params.botToken, params.chatId, text);
}

export async function notifyWebinarDone(params: {
  botToken: string;
  chatId: string | null | undefined;
  webinarTitle: string;
  viewers: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  summary?: string;
}) {
  const text = [
    `✅ <b>Вебинар обработан</b>`,
    ``,
    `📺 ${params.webinarTitle}`,
    ``,
    `👥 Зрителей: <b>${params.viewers}</b>`,
    ``,
    `<b>Сегментация:</b>`,
    `🔥 Горячих: <b>${params.hotLeads}</b>`,
    `⚡ Тёплых: <b>${params.warmLeads}</b>`,
    `❄️ Холодных: <b>${params.coldLeads}</b>`,
    ``,
    `📈 Конверсия (горячие/зрители): <b>${params.conversionRate.toFixed(1)}%</b>`,
    params.summary ? `\n🤖 <b>AI резюме:</b>\n${params.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await broadcast(params.botToken, params.chatId, text);
}
