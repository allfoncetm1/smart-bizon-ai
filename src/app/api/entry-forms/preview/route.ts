import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { normalizeBizonRoomUrl, fetchBizonRoomInfo } from "@/lib/bizon-room";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url обязателен" }, { status: 400 });

  const normalized = normalizeBizonRoomUrl(url);
  if (!normalized) {
    return NextResponse.json({ error: "Это не похоже на ссылку комнаты Bizon365" }, { status: 400 });
  }

  const info = await fetchBizonRoomInfo(normalized);
  return NextResponse.json(info);
}
