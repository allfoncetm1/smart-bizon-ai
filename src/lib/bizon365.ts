import axios, { AxiosInstance } from "axios";

export interface BizonReport {
  webinarId: string;
  name: string;
  type: "LiveWebinars" | "AutoWebinars";
  created: string;
  viewers: number;   // count1
  duration: number;  // count2 (minutes)
  text?: string;
}

export interface BizonViewer {
  username?: string;
  phone?: string;
  chatUserId?: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  view?: number;       // timestamp start
  viewTill?: number;   // timestamp end
  timeOnWebinar?: number; // seconds (computed)
  buttons?: unknown[];
  banners?: unknown[];
  cv?: unknown;        // purchases
  p1?: string;         // utm_source
  p2?: string;         // utm_medium
  p3?: string;         // utm_campaign
}

export interface BizonChatMessage {
  text: string;
  time?: number;
  username?: string;
  chatUserId?: string;
  phone?: string;
  // raw Bizon365 field aliases (handled in parsing)
  body?: string;
  name?: string;
  ts?: number;
}

export interface BizonWebinarDetail {
  roomTitle: string;
  messages: BizonChatMessage[];
  viewersCount: number;
  duration: number;
}

export class Bizon365Client {
  private client: AxiosInstance;

  constructor(apiToken: string, bizonProjectId: string) {
    this.client = axios.create({
      baseURL: `${process.env.BIZON365_API_BASE ?? "https://online.bizon365.ru/api/v2"}/${bizonProjectId}`,
      headers: {
        "X-Token": apiToken,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  async getWebinarList(params?: {
    skip?: number;
    limit?: number;
    type?: "LiveWebinars" | "AutoWebinars";
    minDate?: string;
    maxDate?: string;
  }): Promise<{ count: number; list: BizonReport[] }> {
    const { data } = await this.client.get("/reports/getlist", { params });
    const list: BizonReport[] = (data.list ?? []).map((item: Record<string, unknown>) => ({
      webinarId: item.webinarId as string,
      name: item.name as string,
      type: item.type as "LiveWebinars" | "AutoWebinars",
      created: item.created as string,
      viewers: (item.count1 as number) ?? 0,
      duration: (item.count2 as number) ?? 0,
      text: item.text as string | undefined,
    }));
    return { count: data.count ?? list.length, list };
  }

  async getWebinarDetail(webinarId: string): Promise<BizonWebinarDetail> {
    const { data } = await this.client.get("/reports/get", { params: { webinarId } });

    const roomTitle: string = data.room_title ?? "Без названия";
    const inner = data.report ?? {};

    // messages — может быть JSON-строкой, объектом или массивом на разных уровнях
    let rawItems: unknown[] = [];
    let messageKeys: string[] = [];
    try {
      // Ищем на двух уровнях: data.report.messages и data.messages
      let src: unknown = inner.messages ?? data.messages;
      if (typeof src === "string") src = JSON.parse(src);

      if (Array.isArray(src)) {
        rawItems = src;
        messageKeys = src.map((_: unknown, i: number) => String(i));
      } else if (src && typeof src === "object") {
        messageKeys = Object.keys(src as Record<string, unknown>);
        rawItems = Object.values(src as Record<string, unknown>);
      }
    } catch {
      rawItems = [];
      messageKeys = [];
    }

    // messagesTS — JSON-строка с временными метками
    let messagesTS: Record<string, number> = {};
    try {
      let rawTS: unknown = inner.messagesTS ?? data.messagesTS;
      if (typeof rawTS === "string") rawTS = JSON.parse(rawTS);
      if (rawTS && typeof rawTS === "object" && !Array.isArray(rawTS)) {
        for (const [k, v] of Object.entries(rawTS as Record<string, unknown>)) {
          const n = Number(v);
          if (!isNaN(n)) messagesTS[k] = n;
        }
      }
    } catch {
      messagesTS = {};
    }

    // Нормализуем каждое сообщение — Bizon365 возвращает разные форматы
    const enrichedMessages: BizonChatMessage[] = rawItems.map((m: unknown, i: number) => {
      const key = messageKeys[i] ?? String(i);
      const ts = messagesTS[key] ?? messagesTS[String(i)] ?? 0;

      // Если значение — строка, пробуем JSON.parse, иначе используем как текст
      let msg: Record<string, unknown>;
      if (typeof m === "string") {
        try {
          const parsed = JSON.parse(m);
          msg = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : { text: m };
        } catch {
          msg = { text: m };
        }
      } else if (m && typeof m === "object") {
        msg = m as Record<string, unknown>;
      } else {
        msg = {};
      }

      // Известные поля с метаданными — не трогаем при catch-all
      const META_FIELDS = new Set([
        "phone", "email", "ip", "chatUserId", "chat_user_id",
        "userId", "uid", "city", "country", "region",
      ]);
      const NAME_FIELDS = new Set([
        "username", "name", "user", "u", "sender", "displayName", "n",
      ]);

      // Пробуем все возможные названия поля с текстом
      let text = String(
        msg.text ?? msg.message ?? msg.msg ?? msg.body ??
        msg.m ?? msg.content ?? msg.t ?? msg.txt ?? ""
      );
      // Catch-all: если все поля промахнулись — берём самую длинную строку не из мета/имени
      if (!text) {
        let best = "";
        for (const [k, v] of Object.entries(msg)) {
          if (!META_FIELDS.has(k) && !NAME_FIELDS.has(k) && typeof v === "string" && v.length > best.length) {
            best = v;
          }
        }
        text = best;
      }

      // Пробуем все возможные названия поля с именем пользователя
      const username = (
        (msg.username ?? msg.name ?? msg.user ?? msg.u ??
         msg.sender ?? msg.displayName ?? msg.n) as string | undefined
      ) || undefined;

      return {
        text,
        username,
        chatUserId: (msg.chatUserId ?? msg.chat_user_id ?? msg.userId ?? msg.uid) as string | undefined || undefined,
        phone: msg.phone as string | undefined,
        time: ts,
      };
    });

    // Количество зрителей из report
    const viewersCount = inner.report
      ? Array.isArray(inner.report)
        ? inner.report.length
        : Object.keys(inner.report).length
      : 0;

    return {
      roomTitle,
      messages: enrichedMessages,
      viewersCount,
      duration: 0,
    };
  }

  async getViewers(webinarId: string, skip = 0, limit = 100): Promise<BizonViewer[]> {
    const { data } = await this.client.get("/reports/getviewers", {
      params: { webinarId, skip, limit },
    });
    const viewers: BizonViewer[] = (data.viewers ?? []).map((v: Record<string, unknown>) => ({
      username: v.username as string | undefined,
      phone: v.phone as string | undefined,
      chatUserId: v.chatUserId as string | undefined,
      ip: v.ip as string | undefined,
      city: v.city as string | undefined,
      region: v.region as string | undefined,
      country: v.country as string | undefined,
      view: v.view as number | undefined,
      viewTill: v.viewTill as number | undefined,
      timeOnWebinar:
        v.view && v.viewTill
          ? Math.round(((v.viewTill as number) - (v.view as number)) / 1000)
          : 0,
      buttons: v.buttons as unknown[],
      banners: v.banners as unknown[],
      cv: v.cv,
      p1: v.p1 as string | undefined,
      p2: v.p2 as string | undefined,
      p3: v.p3 as string | undefined,
    }));
    return viewers;
  }

  async getAllViewers(webinarId: string): Promise<BizonViewer[]> {
    const all: BizonViewer[] = [];
    let skip = 0;
    const limit = 1000;
    while (true) {
      const batch = await this.getViewers(webinarId, skip, limit);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    }
    return all;
  }

  async getOrders(params?: {
    skip?: number;
    limit?: number;
    days?: number;
    search?: string;
  }): Promise<{ count: number; orders: unknown[] }> {
    const { data } = await this.client.get("/orders/getorders", { params });
    return { count: data.count ?? 0, orders: data.orders ?? [] };
  }
}

export function createBizon365Client(apiToken: string, projectId: string): Bizon365Client {
  return new Bizon365Client(apiToken, projectId);
}
