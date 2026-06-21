import { google } from "googleapis";

export interface SheetLead {
  name?: string;
  phone?: string;
  mainProblem?: string;
  segment: string;
  score: number;
  webinarTitle: string;
}

const HEADER_ROW = ["Имя", "Телефон", "Главная проблема", "Сегмент", "Балл", "Вебинар", "Дата добавления", "Статус"];

function getSegmentLabel(segment: string): string {
  if (segment === "HOT") return "🔥 Горячий";
  if (segment === "WARM") return "⚡ Тёплый";
  return "❄️ Холодный";
}

async function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS не задан в env");

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function ensureSheetHeader(sheetId: string): Promise<void> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:H1",
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "A1:H1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADER_ROW] },
    });

    // Жирный заголовок
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        }],
      },
    });
  }
}

export async function getExistingPhones(sheetId: string): Promise<Set<string>> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "B2:B",
  });

  const phones = new Set<string>();
  for (const row of res.data.values ?? []) {
    if (row[0]) phones.add(String(row[0]).trim());
  }
  return phones;
}

export async function appendLeadsToSheet(sheetId: string, leads: SheetLead[]): Promise<number> {
  if (leads.length === 0) return 0;

  await ensureSheetHeader(sheetId);
  const existingPhones = await getExistingPhones(sheetId);

  const today = new Date().toLocaleDateString("ru-RU");

  const newRows = leads
    .filter((l) => {
      // Не добавляем если телефон уже есть в таблице
      if (l.phone && existingPhones.has(l.phone.trim())) return false;
      return true;
    })
    .map((l) => [
      l.name ?? "",
      l.phone ?? "",
      l.mainProblem ?? "",
      getSegmentLabel(l.segment),
      l.score,
      l.webinarTitle,
      today,
      "", // Статус — заполняет менеджер
    ]);

  if (newRows.length === 0) return 0;

  const auth = await getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: newRows },
  });

  return newRows.length;
}
