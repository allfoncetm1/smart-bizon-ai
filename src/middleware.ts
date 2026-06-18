import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sb_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "smart-bizon-secret-2026";

const PUBLIC = ["/login", "/r/", "/api/auth/", "/api/og-image/", "/_next/", "/favicon", "/banner"];

async function verifyJWT(token: string): Promise<{ hasAccess: boolean; isAdmin: boolean } | null> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;

    const keyData = new TextEncoder().encode(SECRET);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

    const message = new TextEncoder().encode(`${header}.${body}`);
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, message);
    if (!valid) return null;

    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { hasAccess: payload.hasAccess, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyJWT(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!payload.hasAccess) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    return NextResponse.redirect(new URL("/login?denied=1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
