import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json([]);

  const links = await prisma.linkRedirect.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, slug, destinationUrl, ogTitle, ogDescription, ogImageUrl } = body;

  if (!projectId || !slug || !destinationUrl) {
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
    data: { projectId, slug: cleanSlug, destinationUrl, ogTitle, ogDescription, ogImageUrl },
  });
  return NextResponse.json(link, { status: 201 });
}
