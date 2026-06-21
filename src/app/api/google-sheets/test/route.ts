import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId");

  // 1. Проверяем env
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!raw) {
    return NextResponse.json({ ok: false, step: "env", error: "GOOGLE_SERVICE_ACCOUNT_CREDENTIALS не задан в Render" });
  }

  // 2. Парсим JSON
  let credentials: unknown;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    return NextResponse.json({ ok: false, step: "parse", error: "JSON невалидный: " + String(e) });
  }

  // 3. Авторизация Google
  let auth: InstanceType<typeof google.auth.GoogleAuth>;
  try {
    auth = new google.auth.GoogleAuth({
      credentials: credentials as object,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, step: "auth", error: String(e) });
  }

  if (!sheetId) {
    return NextResponse.json({ ok: true, step: "auth_ok", message: "Авторизация прошла. Передай ?sheetId=... для проверки таблицы" });
  }

  // 4. Пишем тестовую строку
  try {
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["✅ ТЕСТ", "+7 000 000", "Проблема теста", "🔥 Горячий", "85", "Тестовый вебинар", new Date().toLocaleDateString("ru-RU"), ""]] },
    });
    return NextResponse.json({ ok: true, step: "write_ok", message: "Тестовая строка добавлена в таблицу!" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, step: "write", error: msg });
  }
}
