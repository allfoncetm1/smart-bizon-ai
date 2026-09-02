import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeBizonRoomUrl } from "@/lib/bizon-room";

async function getOwned(id: string, userId: string) {
  const form = await prisma.entryForm.findUnique({ where: { id } });
  if (!form || form.userId !== userId) return null;
  return form;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await getOwned(id, session.userId))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const body = await req.json();
  const { slug, bizonRoomUrl, title, isActive } = body;
  const data: Record<string, unknown> = {};

  if (bizonRoomUrl !== undefined) {
    const normalized = normalizeBizonRoomUrl(bizonRoomUrl);
    if (!normalized) return NextResponse.json({ error: "Это не похоже на ссылку комнаты Bizon365" }, { status: 400 });
    data.bizonRoomUrl = normalized;
  }
  if (title !== undefined) data.title = title || null;
  if (isActive !== undefined) data.isActive = isActive;

  if (slug !== undefined) {
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const existing = await prisma.entryForm.findUnique({ where: { slug: cleanSlug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Этот slug уже занят" }, { status: 409 });
    }
    data.slug = cleanSlug;
  }

  const form = await prisma.entryForm.update({ where: { id }, data });
  return NextResponse.json(form);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await getOwned(id, session.userId))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.entryForm.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
