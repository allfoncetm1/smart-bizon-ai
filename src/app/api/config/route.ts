import { NextResponse } from "next/server";
import { getRawSession } from "@/lib/auth";
import { getAppConfig } from "@/lib/app-config";
import { PLAN_META } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Несекретные глобальные настройки для сайдбара и страницы /billing.
export async function GET() {
  const session = await getRawSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const c = await getAppConfig();
  return NextResponse.json({
    sectionsOff: c.sectionsOff,
    trialDays: c.trialDays,
    payMethods: c.payMethods,
    plans: {
      MONTHLY: { ...PLAN_META.MONTHLY, amount: c.monthlyPrice },
      YEARLY: { ...PLAN_META.YEARLY, amount: c.yearlyPrice },
    },
  });
}
