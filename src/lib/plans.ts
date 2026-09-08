// Метаданные тарифов. Цены и длина триала — в БД (AppConfig), редактируются
// из /admin; здесь только неизменяемая часть + значения по умолчанию.

import type { PlanId } from "@prisma/client";

export interface PlanMeta {
  id: PlanId;
  label: string;
  days: number; // на сколько продлевает доступ
}

export const PLAN_META: Record<PlanId, PlanMeta> = {
  MONTHLY: { id: "MONTHLY", label: "Месяц", days: 30 },
  YEARLY: { id: "YEARLY", label: "Год", days: 365 },
};

export const DEFAULT_MONTHLY_PRICE = 5000;
export const DEFAULT_YEARLY_PRICE = 50000;
export const DEFAULT_TRIAL_DAYS = 3;

// Разделы сайдбара, которые можно закрывать плашкой «Скоро».
export const TOGGLEABLE_SECTIONS: { key: string; label: string }[] = [
  { key: "webinars", label: "Вебинары" },
  { key: "leads", label: "CRM / Лиды" },
  { key: "analytics", label: "Аналитика" },
  { key: "redirects", label: "Link Preview" },
  { key: "entry-forms", label: "Формы входа" },
  { key: "agent", label: "Настройки агента" },
];

export function isPlanId(v: string): v is PlanId {
  return v === "MONTHLY" || v === "YEARLY";
}
