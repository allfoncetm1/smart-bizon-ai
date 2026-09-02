import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeBizonRoomUrl, fetchBizonRoomInfo } from "@/lib/bizon-room";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forms = await prisma.entryForm.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(forms);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, bizonRoomUrl, title } = body;

  if (!slug || !bizonRoomUrl) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  const normalizedUrl = normalizeBizonRoomUrl(bizonRoomUrl);
  if (!normalizedUrl) {
    return NextResponse.json({ error: "Это не похоже на ссылку комнаты Bizon365" }, { status: 400 });
  }

  const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!cleanSlug) {
    return NextResponse.json({ error: "Некорректный slug" }, { status: 400 });
  }

  const existing = await prisma.entryForm.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    return NextResponse.json({ error: "Этот slug уже занят" }, { status: 409 });
  }

  let finalTitle = title || null;
  if (!finalTitle) {
    const info = await fetchBizonRoomInfo(normalizedUrl);
    finalTitle = info.title;
  }

  const form = await prisma.entryForm.create({
    data: { userId: session.userId, slug: cleanSlug, bizonRoomUrl: normalizedUrl, title: finalTitle },
  });

  return NextResponse.json(form, { status: 201 });
}
