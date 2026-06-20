import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const webinarId = searchParams.get("webinarId");
  const projectId = searchParams.get("projectId");

  if (!webinarId || !projectId) {
    return NextResponse.json({ error: "webinarId and projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data } = await axios.get(
    `${process.env.BIZON365_API_BASE ?? "https://online.bizon365.ru/api/v2"}/${project.bizonId}/reports/get`,
    {
      params: { webinarId },
      headers: { "X-Token": project.apiToken },
      timeout: 30000,
    }
  );

  const inner = data.report ?? {};

  // Распарсить messages
  let parsedMessages: unknown = null;
  try {
    parsedMessages = typeof inner.messages === "string"
      ? JSON.parse(inner.messages)
      : (inner.messages ?? data.messages ?? null);
  } catch { parsedMessages = inner.messages; }

  // Распарсить messagesTS
  let parsedTS: unknown = null;
  try {
    parsedTS = typeof inner.messagesTS === "string"
      ? JSON.parse(inner.messagesTS)
      : (inner.messagesTS ?? data.messagesTS ?? null);
  } catch { parsedTS = inner.messagesTS; }

  // Первые 3 элемента messages для анализа
  let sampleItems: unknown[] = [];
  if (Array.isArray(parsedMessages)) {
    sampleItems = parsedMessages.slice(0, 3);
  } else if (parsedMessages && typeof parsedMessages === "object") {
    sampleItems = Object.entries(parsedMessages as Record<string, unknown>).slice(0, 3);
  }

  return NextResponse.json({
    topLevelKeys: Object.keys(data),
    reportKeys: Object.keys(inner),
    roomTitle: data.room_title,

    // Тип поля messages
    messagesLocation: inner.messages !== undefined ? "data.report.messages" : data.messages !== undefined ? "data.messages" : "NOT FOUND",
    messagesRawType: typeof (inner.messages ?? data.messages),
    parsedMessagesType: Array.isArray(parsedMessages) ? "array" : typeof parsedMessages,
    parsedMessagesLength: Array.isArray(parsedMessages)
      ? parsedMessages.length
      : parsedMessages && typeof parsedMessages === "object"
      ? Object.keys(parsedMessages as object).length
      : 0,

    // Первые 3 сообщения — ЭТО ГЛАВНОЕ для диагноза
    sampleItems,

    // Тип messagesTS
    messagesTS_location: inner.messagesTS !== undefined ? "data.report.messagesTS" : "data.messagesTS",
    parsedTS_sample: parsedTS && typeof parsedTS === "object"
      ? Object.entries(parsedTS as Record<string, unknown>).slice(0, 3)
      : parsedTS,
  });
}
