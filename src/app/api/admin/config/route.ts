import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRawSession } from "@/lib/auth";
import { getAppConfig } from "@/lib/app-config";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  monthlyPrice: z.number().int().min(100).max(1_000_000).optional(),
  yearlyPrice: z.number().int().min(100).max(1_000_000).optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
  sectionsOff: z.array(z.string()).optional(),
  payMethods: z.array(z.enum(["QR", "PHONE"])).optional(),
  apipayApiBase: z.string().optional(),
  apipayApiKey: z.string().optional(),
  apipayWebhookSecret: z.string().optional(),
});

export async function GET() {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const c = await getAppConfig();
  return NextResponse.json(c);
}

export async function PATCH(req: NextRequest) {
  const session = await getRawSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let data: z.infer<typeof patchSchema>;
  try {
    data = patchSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const updated = await prisma.appConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return NextResponse.json(updated);
}
