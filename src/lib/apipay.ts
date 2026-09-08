// Клиент ApiPay (https://apipay.kz) — приём платежей через Kaspi.
// Док: https://apipay.kz/docs.html — счета (/invoices, /invoices/qr) и вебхуки.

import { createHmac, timingSafeEqual } from "crypto";

const API_BASE = process.env.APIPAY_API_BASE ?? "https://api.apipay.kz/api/v1";
const API_KEY = process.env.APIPAY_API_KEY ?? "";
const WEBHOOK_SECRET = process.env.APIPAY_WEBHOOK_SECRET ?? "";

/**
 * Проверка подписи вебхука. ApiPay присылает заголовок
 * `X-Webhook-Signature: sha256=<hex>` — это HMAC-SHA256 от СЫРОГО тела запроса
 * с секретом из дашборда. Сравнение — постоянное по времени.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");
  const got = Buffer.from(signatureHeader);
  const exp = Buffer.from(expected);
  if (got.length !== exp.length) return false;
  return timingSafeEqual(exp, got);
}

/** Приводит номер к формату Kaspi/ApiPay — 8XXXXXXXXXX (11 цифр). null если не выходит. */
export function normalizeKzPhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  let d = digits;
  if (d.length === 11 && d.startsWith("7")) d = "8" + d.slice(1); // +7... -> 8...
  if (d.length === 10) d = "8" + d; // XXXXXXXXXX -> 8XXXXXXXXXX
  return d.length === 11 && d.startsWith("8") ? d : null;
}

interface ApiPayInvoice {
  id?: number | string;
  status?: string;
  qr_token_url?: string;
  qr_image_url?: string;
  qr_expires_at?: string;
  error_code?: string;
  message?: string;
  [k: string]: unknown;
}

async function post(path: string, body: Record<string, unknown>): Promise<ApiPayInvoice> {
  if (!API_KEY) throw new Error("APIPAY_API_KEY не задан в env");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": String(body.external_order_id ?? ""),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))) as ApiPayInvoice;
  if (!res.ok) {
    const reason = data.error_code || data.message || `HTTP ${res.status}`;
    throw new Error(`ApiPay ${path}: ${reason}`);
  }
  return data;
}

export interface CreatedInvoice {
  invoiceId: string | null;
  status: string | null;
  qrTokenUrl: string | null;
  qrImageUrl: string | null;
  raw: ApiPayInvoice;
}

/** QR-счёт: клиент открывает ссылку/сканирует код, номер телефона не нужен. */
export async function createQrInvoice(params: {
  amount: number;
  description: string;
  externalOrderId: string;
}): Promise<CreatedInvoice> {
  const data = await post("/invoices/qr", {
    amount: params.amount,
    description: params.description.slice(0, 100),
    external_order_id: params.externalOrderId,
  });
  return {
    invoiceId: data.id != null ? String(data.id) : null,
    status: data.status ?? "pending",
    qrTokenUrl: data.qr_token_url ?? null,
    qrImageUrl: data.qr_image_url ?? null,
    raw: data,
  };
}

/** Счёт по номеру телефона: клиенту приходит push в приложении Kaspi. */
export async function createPhoneInvoice(params: {
  amount: number;
  phone: string;
  description: string;
  externalOrderId: string;
}): Promise<CreatedInvoice> {
  const data = await post("/invoices", {
    amount: params.amount,
    phone_number: params.phone,
    description: params.description.slice(0, 60),
    external_order_id: params.externalOrderId,
  });
  return {
    invoiceId: data.id != null ? String(data.id) : null,
    status: data.status ?? "processing",
    qrTokenUrl: null,
    qrImageUrl: null,
    raw: data,
  };
}
