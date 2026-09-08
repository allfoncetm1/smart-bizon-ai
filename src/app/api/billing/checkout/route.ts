import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRawSession } from "@/lib/auth";
import { normalizeKzPhone } from "@/lib/apipay";
import { startCheckout } from "@/lib/billing";

export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
  method: z.enum(["QR", "PHONE"]),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // getRawSession — платит всегда сам пользователь, даже если админ «смотрит как».
  const session = await getRawSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (input.method === "PHONE" && !normalizeKzPhone(input.phone ?? "")) {
    return NextResponse.json({ error: "Неверный номер телефона. Формат: 8XXXXXXXXXX" }, { status: 400 });
  }

  try {
    const out = await startCheckout({
      userId: session.userId,
      plan: input.plan,
      method: input.method,
      phone: input.phone,
    });
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    // Ошибка на стороне ApiPay (KYC не пройден, тариф неактивен, лимит и т.п.)
    console.error("Billing checkout error:", e);
    const msg = e instanceof Error ? e.message : "Не удалось создать счёт";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
