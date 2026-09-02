import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Link Preview belongs to the account, not to a connected Bizon365
  // project — works the same whether or not one is set up.
  const links = await prisma.linkRedirect.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, destinationUrl, ogTitle, ogDescription, ogImageUrl, ogImageBlob, ogImageMime } = body;

  if (!slug || !destinationUrl) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!cleanSlug) {
    return NextResponse.json({ error: "Некорректный slug" }, { status: 400 });
  }

  const existing = await prisma.linkRedirect.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    return NextResponse.json({ error: "Этот slug уже занят" }, { status: 409 });
  }

  const link = await prisma.linkRedirect.create({
    data: { userId: session.userId, slug: cleanSlug, destinationUrl, ogTitle, ogDescription, ogImageUrl, ogImageBlob, ogImageMime },
  });

  // If image was uploaded as blob — set its serving URL
  if (ogImageBlob) {
    const imageUrl = `${getOrigin(req)}/api/og-image/${link.id}`;
    const updated = await prisma.linkRedirect.update({
      where: { id: link.id },
      data: { ogImageUrl: imageUrl },
    });
    return NextResponse.json(updated, { status: 201 });
  }

  return NextResponse.json(link, { status: 201 });
}
