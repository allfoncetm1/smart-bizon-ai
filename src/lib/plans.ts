// Тарифы подписки на платформу. Суммы — целые тенге (ApiPay дробных не принимает).
// Меняются здесь и больше нигде. Если годовой тариф не нужен — убрать YEARLY.

import type { PlanId } from "@prisma/client";

export interface Plan {
  id: PlanId;
  label: string;
  amount: number; // тенге
  days: number; // на сколько продлевает доступ
}

export const PLANS: Record<PlanId, Plan> = {
  MONTHLY: { id: "MONTHLY", label: "Месяц", amount: 5000, days: 30 },
  YEARLY: { id: "YEARLY", label: "Год", amount: 50000, days: 365 },
};

export const TRIAL_DAYS = 3;

export function getPlan(id: string): Plan | null {
  return (PLANS as Record<string, Plan>)[id] ?? null;
}
