import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { slug, destinationUrl, ogTitle, ogDescription, ogImageUrl, isActive } = body;

  const data: Record<string, unknown> = {};
  if (destinationUrl !== undefined) data.destinationUrl = destinationUrl;
  if (ogTitle !== undefined) data.ogTitle = ogTitle;
  if (ogDescription !== undefined) data.ogDescription = ogDescription;
  if (ogImageUrl !== undefined) data.ogImageUrl = ogImageUrl;
  if (isActive !== undefined) data.isActive = isActive;
  if (slug !== undefined) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const existing = await prisma.linkRedirect.findUnique({ where: { slug: cleanSlug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Этот slug уже занят" }, { status: 409 });
    }
    data.slug = cleanSlug;
  }

  const link = await prisma.linkRedirect.update({ where: { id }, data });
  return NextResponse.json(link);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.linkRedirect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
