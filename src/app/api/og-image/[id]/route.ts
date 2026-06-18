import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await prisma.linkRedirect.findUnique({ where: { id } });

  if (!link?.ogImageBlob) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = Buffer.from(link.ogImageBlob, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": link.ogImageMime ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
