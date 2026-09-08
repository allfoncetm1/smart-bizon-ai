import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRawSession } from "@/lib/auth";
import { grantComp } from "@/lib/billing";

export const dynamic = "force-dynamic";

const schema = z.object({ days: z.number().int().min(1).max(3650) });

// Выдать пользователю доступ вручную на N дней (accessVia = COMP).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let days: number;
  try {
    days = schema.parse(await req.json()).days;
  } catch {
    return NextResponse.json({ error: "Укажите число дней" }, { status: 400 });
  }

  await grantComp(id, days);
  return NextResponse.json({ ok: true });
}
