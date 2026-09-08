// Единая точка доступа к глобальным настройкам (AppConfig, одна строка).
// Цены/триал/закрытые разделы/ключи ApiPay редактируются из /admin.

import type { AppConfig, PlanId } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_META } from "@/lib/plans";

/** Строка настроек. Создаётся миграцией; upsert — страховка для пустой БД. */
export async function getAppConfig(): Promise<AppConfig> {
  return prisma.appConfig.upsert({ where: { id: "singleton" }, create: {}, update: {} });
}

export interface PlanFull {
  id: PlanId;
  label: string;
  days: number;
  amount: number; // тенге
}

export async function getPlans(): Promise<Record<PlanId, PlanFull>> {
  const c = await getAppConfig();
  return {
    MONTHLY: { ...PLAN_META.MONTHLY, amount: c.monthlyPrice },
    YEARLY: { ...PLAN_META.YEARLY, amount: c.yearlyPrice },
  };
}

export async function getTrialDays(): Promise<number> {
  return (await getAppConfig()).trialDays;
}

export async function isSectionEnabled(key: string): Promise<boolean> {
  return !(await getAppConfig()).sectionsOff.includes(key);
}

export async function getPayMethods(): Promise<string[]> {
  const m = (await getAppConfig()).payMethods;
  return m.length ? m : ["QR", "PHONE"];
}

/** Ключи ApiPay: значение из БД, иначе из переменных окружения. */
export async function getApipayConfig(): Promise<{ apiBase: string; apiKey: string; webhookSecret: string }> {
  const c = await getAppConfig();
  return {
    apiBase: c.apipayApiBase || process.env.APIPAY_API_BASE || "https://api.apipay.kz/api/v1",
    apiKey: c.apipayApiKey || process.env.APIPAY_API_KEY || "",
    webhookSecret: c.apipayWebhookSecret || process.env.APIPAY_WEBHOOK_SECRET || "",
  };
}
