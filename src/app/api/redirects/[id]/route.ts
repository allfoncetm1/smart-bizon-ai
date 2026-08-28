import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, type EffectiveSession } from "@/lib/auth";

function getOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function getOwnedRedirect(id: string, session: EffectiveSession) {
  const link = await prisma.linkRedirect.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!link) return null;
  if (link.project.userId !== session.userId) return null;
  return link;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await getOwnedRedirect(id, session))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const body = await req.json();
  const { slug, destinationUrl, ogTitle, ogDescription, ogImageUrl, ogImageBlob, ogImageMime, isActive } = body;

  const data: Record<string, unknown> = {};
  if (destinationUrl !== undefined) data.destinationUrl = destinationUrl;
  if (ogTitle !== undefined) data.ogTitle = ogTitle;
  if (ogDescription !== undefined) data.ogDescription = ogDescription;
  if (isActive !== undefined) data.isActive = isActive;

  if (ogImageBlob) {
    data.ogImageBlob = ogImageBlob;
    data.ogImageMime = ogImageMime ?? "image/jpeg";
    data.ogImageUrl = `${getOrigin(req)}/api/og-image/${id}`;
  } else if (ogImageUrl !== undefined) {
    data.ogImageUrl = ogImageUrl;
    data.ogImageBlob = null;
    data.ogImageMime = null;
  }

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!(await getOwnedRedirect(id, session))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.linkRedirect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
