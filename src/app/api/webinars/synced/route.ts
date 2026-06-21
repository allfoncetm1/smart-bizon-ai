import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId обязателен" }, { status: 400 });
  }

  const webinars = await prisma.webinar.findMany({
    where: { projectId, status: "DONE" },
    select: { id: true, title: true, bizonId: true, createdAt: true, viewersCount: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webinars);
}
