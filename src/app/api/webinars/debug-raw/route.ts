import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBizon365Client } from "@/lib/bizon365";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const webinarId = searchParams.get("webinarId");
  const projectId = searchParams.get("projectId");

  if (!webinarId || !projectId) {
    return NextResponse.json({ error: "webinarId and projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const bizon = createBizon365Client(project.apiToken, project.bizonId);

  // Получаем сырой ответ напрямую через axios
  const axios = (await import("axios")).default;
  const { data } = await axios.get(
    `${process.env.BIZON365_API_BASE ?? "https://online.bizon365.ru/api/v2"}/${project.bizonId}/reports/get`,
    {
      params: { webinarId },
      headers: { "X-Token": project.apiToken },
      timeout: 30000,
    }
  );

  // Возвращаем сырые данные для анализа структуры
  const inner = data.report ?? {};
  let rawMessages: unknown = null;
  try {
    rawMessages = typeof inner.messages === "string"
      ? JSON.parse(inner.messages)
      : inner.messages;
  } catch { rawMessages = inner.messages; }

  // Первые 3 сообщения для анализа структуры полей
  let sampleMessages: unknown[] = [];
  if (Array.isArray(rawMessages)) {
    sampleMessages = rawMessages.slice(0, 3);
  } else if (rawMessages && typeof rawMessages === "object") {
    sampleMessages = Object.values(rawMessages as Record<string, unknown>).slice(0, 3);
  }

  return NextResponse.json({
    roomTitle: data.room_title,
    reportKeys: Object.keys(inner),
    messagesType: typeof inner.messages,
    rawMessagesType: Array.isArray(rawMessages) ? "array" : typeof rawMessages,
    rawMessagesLength: Array.isArray(rawMessages)
      ? rawMessages.length
      : rawMessages && typeof rawMessages === "object"
      ? Object.keys(rawMessages as object).length
      : 0,
    sampleMessages,
    messagesTSType: typeof inner.messagesTS,
    rawMessagesTSSample: (() => {
      try {
        const ts = typeof inner.messagesTS === "string" ? JSON.parse(inner.messagesTS) : inner.messagesTS;
        return ts ? Object.entries(ts as Record<string, unknown>).slice(0, 3) : null;
      } catch { return null; }
    })(),
  });
}
