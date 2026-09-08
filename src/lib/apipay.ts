// Клиент ApiPay (https://apipay.kz) — приём платежей через Kaspi.
// Док: https://apipay.kz/docs.html — счета (/invoices, /invoices/qr) и вебхуки.
// Ключи берутся из AppConfig (БД), иначе из env — см. getApipayConfig().

import { createHmac, timingSafeEqual } from "crypto";
import { getApipayConfig } from "@/lib/app-config";

/**
 * Проверка подписи вебхука. ApiPay присылает заголовок
 * `X-Webhook-Signature: sha256=<hex>` — это HMAC-SHA256 от СЫРОГО тела запроса
 * с секретом из дашборда. Сравнение — постоянное по времени.
 */
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const { webhookSecret } = await getApipayConfig();
  if (!webhookSecret || !signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("hex");
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
  const { apiBase, apiKey } = await getApipayConfig();
  if (!apiKey) throw new Error("ApiPay: не задан API-ключ (в /admin → Платежи или в env)");
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
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
