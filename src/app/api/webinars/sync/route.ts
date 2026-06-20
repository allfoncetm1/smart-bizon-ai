import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBizon365Client } from "@/lib/bizon365";
import { moderateChatMessages, generateWebinarSummary, generateAutoAnswer, generateLeadCards } from "@/lib/ai-agent";
import { notifyHotLead, notifyWebinarDone } from "@/lib/telegram";
import type { BizonChatMessage, BizonViewer } from "@/lib/bizon365";

export async function POST(req: NextRequest) {
  let webinarDbId: string | null = null;
  try {
    const { projectId, webinarId } = await req.json();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { agentConfig: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const bizon = createBizon365Client(project.apiToken, project.bizonId);
    const config = project.agentConfig;

    // Отмечаем как "в обработке"
    await prisma.webinar.upsert({
      where: { bizonId: webinarId },
      create: {
        bizonId: webinarId,
        projectId: project.id,
        title: "Загрузка...",
        type: "AUTO",
        status: "PROCESSING",
      },
      update: { status: "PROCESSING" },
    });

    // Загружаем данные параллельно
    const [detail, viewers] = await Promise.all([
      bizon.getWebinarDetail(webinarId),
      bizon.getAllViewers(webinarId),
    ]);

    // Сохраняем вебинар
    const webinar = await prisma.webinar.upsert({
      where: { bizonId: webinarId },
      create: {
        bizonId: webinarId,
        projectId: project.id,
        title: detail.roomTitle,
        type: "AUTO",
        status: "PROCESSING",
        viewersCount: viewers.length,
      },
      update: {
        title: detail.roomTitle,
        viewersCount: viewers.length,
        status: "PROCESSING",
      },
    });
    webinarDbId = webinar.id;

    // AI модерация чата — батчами по 50 чтобы не переполнять промпт
    const messages: BizonChatMessage[] = detail.messages;
    const moderationResults: Awaited<ReturnType<typeof moderateChatMessages>> = [];
    if (config?.moderationEnabled && messages.length > 0) {
      const MOD_BATCH = 50;
      for (let i = 0; i < messages.length; i += MOD_BATCH) {
        const batch = await moderateChatMessages(
          messages.slice(i, i + MOD_BATCH),
          config.customBanWords ?? []
        );
        moderationResults.push(...batch);
      }
    }

    // Генерация AI ответов на вопросы (параллельно, батч 5)
    const autoAnswerMap: Record<number, string> = {};
    if (config?.autoAnswersEnabled && moderationResults.length > 0) {
      const faqRaw = config.customFaq;
      const faq = Array.isArray(faqRaw)
        ? (faqRaw as { question: string; answer: string }[])
        : [];
      const ctx = {
        productDescription: config.productDescription ?? undefined,
        targetAudience: config.targetAudience ?? undefined,
        salesScript: config.salesScript ?? undefined,
        faq,
      };
      const questionIdxs = moderationResults
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.isQuestion);

      for (let i = 0; i < questionIdxs.length; i += 5) {
        await Promise.all(
          questionIdxs.slice(i, i + 5).map(async ({ i: idx }) => {
            const text = messages[idx]?.text;
            if (text) {
              try {
                autoAnswerMap[idx] = await generateAutoAnswer(text, ctx);
              } catch { /* не блокируем синк */ }
            }
          })
        );
      }
    }

    // Сохраняем сообщения чата
    if (messages.length > 0) {
      await prisma.chatMessage.deleteMany({ where: { webinarId: webinar.id } });

      const BATCH = 100;
      for (let i = 0; i < messages.length; i += BATCH) {
        const slice = messages.slice(i, i + BATCH);
        await prisma.chatMessage.createMany({
          data: slice.map((msg, j) => {
            const globalIdx = i + j;
            const mod = moderationResults[globalIdx];
            return {
              webinarId: webinar.id,
              senderName: msg.username,
              text: msg.text ?? "",
              sentAt: msg.time ? new Date(msg.time) : new Date(),
              isSpam: mod?.isSpam ?? false,
              isToxic: mod?.isToxic ?? false,
              isQuestion: mod?.isQuestion ?? false,
              aiAnswer: autoAnswerMap[globalIdx] ?? null,
            };
          }),
        });
      }
    }

    // Считаем сообщения на участника по chatUserId/username
    const msgCountMap: Record<string, number> = {};
    const msgTextMap: Record<string, string[]> = {};
    for (const msg of messages) {
      const key = msg.chatUserId ?? msg.username ?? msg.phone ?? "";
      if (key) {
        msgCountMap[key] = (msgCountMap[key] ?? 0) + 1;
        if (msg.text) {
          if (!msgTextMap[key]) msgTextMap[key] = [];
          msgTextMap[key].push(msg.text);
        }
      }
    }

    // Максимальное время просмотра для нормализации
    const maxTime = Math.max(...viewers.map((v) => v.timeOnWebinar ?? 0), 1);

    const viewersForScoring = viewers.map((v: BizonViewer) => {
      const key = v.chatUserId ?? v.username ?? v.phone ?? "";
      return {
        email: v.phone ?? v.chatUserId ?? v.username ?? "unknown",
        timeOnWebinar: v.timeOnWebinar ?? 0,
        messagesCount: msgCountMap[key] ?? 0,
        clickedButtons: Array.isArray(v.buttons) ? v.buttons.length : 0,
      };
    });

    // Скоринг: время (40) + сообщения (40) + клики (20)
    const leadScores = viewersForScoring.map((v) => {
      let score = 0;
      score += Math.round((v.timeOnWebinar / maxTime) * 40);
      if (v.messagesCount >= 5) score += 40;
      else if (v.messagesCount >= 2) score += 25;
      else if (v.messagesCount >= 1) score += 10;
      if (v.clickedButtons >= 3) score += 20;
      else if (v.clickedButtons >= 1) score += 10;

      const hot = config?.hotScoreThreshold ?? 50;
      const warm = config?.warmScoreThreshold ?? 20;
      const segment = score >= hot ? "HOT" : score >= warm ? "WARM" : "COLD";
      const action = segment === "HOT"
        ? "Позвонить в течение 24 часов"
        : segment === "WARM"
        ? "Отправить письмо с оффером"
        : "Добавить в email-цепочку";
      return { email: v.email, score, segment: segment as "HOT" | "WARM" | "COLD", reasoning: `Время: ${v.timeOnWebinar}с, сообщений: ${v.messagesCount}, кликов: ${v.clickedButtons}`, recommendedAction: action };
    });

    // AI карточки лидов — топ-30 по баллу (батчи по 5)
    const aiCardMap: Record<string, Awaited<ReturnType<typeof generateLeadCards>>[string]> = {};
    const TOP_FOR_CARDS = 30;
    const CARD_BATCH = 5;
    const sortedForCards = [...leadScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_FOR_CARDS);

    for (let i = 0; i < sortedForCards.length; i += CARD_BATCH) {
      const batch = sortedForCards.slice(i, i + CARD_BATCH);
      const batchInput = batch.map((ls) => {
        const v = viewers.find(
          (vw) => (vw.phone ?? vw.chatUserId ?? vw.username) === ls.email
        );
        const key = v ? (v.chatUserId ?? v.username ?? v.phone ?? "") : "";
        return {
          identifier: ls.email,
          name: v?.username,
          timeOnWebinar: v?.timeOnWebinar ?? 0,
          segment: ls.segment,
          score: ls.score,
          chatMessages: msgTextMap[key] ?? [],
          clickedButtons: Array.isArray(v?.buttons) ? v.buttons.length : 0,
          country: v?.country,
        };
      });
      try {
        const cards = await generateLeadCards(batchInput, {
          webinarTitle: detail.roomTitle,
          productDescription: config?.productDescription ?? undefined,
        });
        Object.assign(aiCardMap, cards);
      } catch { /* не блокируем синк */ }
    }

    // Сохраняем участников и лиды
    for (let i = 0; i < viewers.length; i++) {
      const v = viewers[i];
      const identifier = v.phone ?? v.chatUserId ?? v.username ?? `unknown_${i}`;
      const score = leadScores.find((s) => s.email === identifier);
      const segment = score?.segment ?? "COLD";
      const scoreValue = score?.score ?? 0;

      await prisma.participant.upsert({
        where: { email_webinarId: { email: identifier, webinarId: webinar.id } },
        create: {
          webinarId: webinar.id,
          email: identifier,
          name: v.username,
          phone: v.phone,
          ip: v.ip,
          city: v.city,
          country: v.country,
          utmSource: v.p1,
          utmMedium: v.p2,
          utmCampaign: v.p3,
          timeOnWebinar: v.timeOnWebinar ?? 0,
          segment,
          score: scoreValue,
        },
        update: { segment, score: scoreValue, timeOnWebinar: v.timeOnWebinar ?? 0 },
      });

      const aiCard = aiCardMap[identifier];
      const aiCardFields = aiCard
        ? {
            painPoints: aiCard.painPoints,
            objections: aiCard.objections,
            openingPhrase: aiCard.openingPhrase,
            recommendedProduct: aiCard.recommendedProduct,
            aiCardAt: new Date(),
          }
        : {};

      await prisma.lead.upsert({
        where: { email_webinarId: { email: identifier, webinarId: webinar.id } },
        create: {
          projectId: project.id,
          webinarId: webinar.id,
          email: identifier,
          name: v.username,
          phone: v.phone,
          segment,
          score: scoreValue,
          notes: score?.recommendedAction,
          ...aiCardFields,
        },
        update: {
          segment,
          score: scoreValue,
          notes: score?.recommendedAction,
          ...aiCardFields,
        },
      });
    }

    // Статистика
    const spamCount = moderationResults.filter((m) => m.isSpam).length;
    const questionsCount = moderationResults.filter((m) => m.isQuestion).length;
    const hotCount = leadScores.filter((s) => s.segment === "HOT").length;
    const warmCount = leadScores.filter((s) => s.segment === "WARM").length;
    const coldCount = leadScores.filter((s) => s.segment === "COLD").length;
    const conversionRate = viewers.length > 0 ? (hotCount / viewers.length) * 100 : 0;

    // AI резюме
    const summary = await generateWebinarSummary(
      {
        title: detail.roomTitle,
        duration: detail.duration,
        viewersCount: viewers.length,
        messages: messages.slice(0, 200),
        hotLeadsCount: hotCount,
        purchasesCount: 0,
      },
      config?.productDescription ?? undefined
    );

    // Сохраняем аналитику
    const analyticsData = {
      totalViewers: viewers.length,
      chatMessagesCount: messages.length,
      spamCount,
      questionsCount,
      hotLeadsCount: hotCount,
      warmLeadsCount: warmCount,
      coldLeadsCount: coldCount,
      purchasesCount: 0,
      conversionRate,
      summary: summary.summary,
    };
    await prisma.webinarAnalytics.upsert({
      where: { webinarId: webinar.id },
      create: { webinarId: webinar.id, ...analyticsData },
      update: analyticsData,
    });

    await prisma.webinar.update({
      where: { id: webinar.id },
      data: { status: "DONE", viewersCount: viewers.length },
    });

    // Telegram уведомления
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = config?.telegramChatId;
    if (tgToken && tgChat && tgToken !== "your-telegram-bot-token" && config?.telegramEnabled) {
      await notifyWebinarDone({
        botToken: tgToken,
        chatId: tgChat,
        webinarTitle: detail.roomTitle,
        viewers: viewers.length,
        hotLeads: hotCount,
        warmLeads: warmCount,
        coldLeads: coldCount,
        conversionRate,
        summary: summary.summary,
      });

      if (config.notifyOnHotLead) {
        const hotLeadsList = viewers.filter((_, i) => leadScores[i]?.segment === "HOT").slice(0, 5);
        for (const v of hotLeadsList) {
          const s = leadScores.find((ls) => ls.email === (v.phone ?? v.chatUserId ?? v.username));
          if (!s) continue;
          await notifyHotLead({
            botToken: tgToken,
            chatId: tgChat,
            webinarTitle: detail.roomTitle,
            name: v.username,
            phone: v.phone,
            score: s.score,
            action: s.recommendedAction,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      webinarId: webinar.id,
      stats: {
        viewers: viewers.length,
        messages: messages.length,
        spam: spamCount,
        questions: questionsCount,
        hotLeads: hotCount,
        conversionRate,
        summary: summary.summary,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    if (webinarDbId) {
      await prisma.webinar.update({
        where: { id: webinarDbId },
        data: { status: "ERROR" },
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Ошибка синхронизации" }, { status: 500 });
  }
}
