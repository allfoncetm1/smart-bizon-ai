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

    // Bizon365 формат: messages = { [chatUserId]: string[] }
    // messagesTS = { [chatUserId]: number[] } (секунды от начала вебинара)
    let messagesMap: Record<string, unknown> | null = null;
    let messagesList: unknown[] | null = null;
    try {
      let src: unknown = inner.messages ?? data.messages;
      if (typeof src === "string") src = JSON.parse(src);
      if (Array.isArray(src)) {
        messagesList = src;
      } else if (src && typeof src === "object") {
        messagesMap = src as Record<string, unknown>;
      }
    } catch { /* ignore */ }

    let tsMap: Record<string, unknown> = {};
    try {
      let rawTS: unknown = inner.messagesTS ?? data.messagesTS;
      if (typeof rawTS === "string") rawTS = JSON.parse(rawTS);
      if (rawTS && typeof rawTS === "object" && !Array.isArray(rawTS)) {
        tsMap = rawTS as Record<string, unknown>;
      }
    } catch { /* ignore */ }

    const enrichedMessages: BizonChatMessage[] = [];

    if (messagesMap) {
      // Основной формат Bizon365: ключ = chatUserId, значение = string[]
      for (const [chatUserId, msgData] of Object.entries(messagesMap)) {
        const msgArray: unknown[] = Array.isArray(msgData) ? msgData : [msgData];
        const tsRaw = tsMap[chatUserId];
        const tsArray: number[] = Array.isArray(tsRaw) ? tsRaw.map(Number) : [];

        for (let i = 0; i < msgArray.length; i++) {
          const raw = msgArray[i];
          let text = "";
          if (typeof raw === "string") {
            text = raw;
          } else if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            text = String(
              obj.text ?? obj.message ?? obj.msg ?? obj.body ??
              obj.m ?? obj.content ?? obj.t ?? obj.txt ?? ""
            );
            if (!text) {
              let best = "";
              for (const [, v] of Object.entries(obj)) {
                if (typeof v === "string" && v.length > best.length) best = v;
              }
              text = best;
            }
          }
          enrichedMessages.push({
            text,
            chatUserId,
            username: undefined, // подставляется из viewers в sync route
            phone: undefined,
            time: tsArray[i] ?? 0,
          });
        }
      }
    } else if (messagesList) {
      // Запасной формат: массив объектов сообщений
      for (const m of messagesList) {
        if (!m || typeof m !== "object") continue;
        const obj = m as Record<string, unknown>;
        const text = String(
          obj.text ?? obj.message ?? obj.msg ?? obj.body ??
          obj.m ?? obj.content ?? obj.t ?? obj.txt ?? ""
        );
        const username = (
          obj.username ?? obj.name ?? obj.user ?? obj.u ??
          obj.sender ?? obj.displayName ?? obj.n ?? obj.nick
        ) as string | undefined || undefined;
        enrichedMessages.push({
          text,
          username,
          chatUserId: (obj.chatUserId ?? obj.chat_user_id ?? obj.userId ?? obj.uid) as string | undefined || undefined,
          phone: obj.phone as string | undefined,
          time: typeof obj.ts === "number" ? obj.ts : typeof obj.time === "number" ? obj.time : 0,
        });
      }
    }

    return {
      roomTitle,
      messages: enrichedMessages,
      viewersCount: 0,
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
