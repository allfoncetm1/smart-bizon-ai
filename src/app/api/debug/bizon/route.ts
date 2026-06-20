import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

// Debug only — remove after fixing chat field names
export async function GET(req: NextRequest) {
  const webinarId = req.nextUrl.searchParams.get("webinarId");
  if (!webinarId) return NextResponse.json({ error: "webinarId required" }, { status: 400 });

  const project = await prisma.project.findFirst();
  if (!project) return NextResponse.json({ error: "No project" }, { status: 404 });

  const base = `${process.env.BIZON365_API_BASE ?? "https://online.bizon365.ru/api/v2"}/${project.bizonId}`;
  const { data } = await axios.get(`${base}/reports/get`, {
    params: { webinarId },
    headers: { "X-Token": project.apiToken },
    timeout: 15000,
  });

  const inner = data.report ?? {};
  let rawMessages: unknown = inner.messages;

  // Try to parse if string
  if (typeof rawMessages === "string") {
    try { rawMessages = JSON.parse(rawMessages); } catch { /* keep as string */ }
  }

  // Show first 3 entries only
  let sample: unknown = rawMessages;
  if (Array.isArray(rawMessages)) {
    sample = rawMessages.slice(0, 3);
  } else if (rawMessages && typeof rawMessages === "object") {
    const keys = Object.keys(rawMessages as object).slice(0, 3);
    sample = Object.fromEntries(keys.map(k => [k, (rawMessages as Record<string, unknown>)[k]]));
  }

  return NextResponse.json({
    roomTitle: data.room_title,
    messagesType: Array.isArray(rawMessages) ? "array" : typeof rawMessages,
    totalMessages: Array.isArray(rawMessages)
      ? rawMessages.length
      : rawMessages && typeof rawMessages === "object"
      ? Object.keys(rawMessages as object).length
      : 0,
    sample,
    rawMessagesTS: (() => {
      try {
        const ts = inner.messagesTS;
        if (typeof ts === "string") return JSON.parse(ts);
        return ts;
      } catch { return null; }
    })(),
  });
}
