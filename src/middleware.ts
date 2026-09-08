import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sb_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "smart-bizon-secret-2026";

// Публичные пути (без сессии). /api/payments/ — вебхук ApiPay, он проверяет
// свою подпись сам. /api/auth/ покрывает и /api/auth/refresh.
const PUBLIC = ["/login", "/r/", "/j/", "/api/auth/", "/api/payments/", "/api/og-image/", "/_next/", "/favicon", "/banner"];

interface JWTClaims {
  hasAccess: boolean;
  isAdmin: boolean;
  accessVia?: "trial" | "paid" | "admin" | "comp";
  trialEndsAt?: number | null;
}

async function verifyJWT(token: string): Promise<JWTClaims | null> {
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

    return {
      hasAccess: payload.hasAccess,
      isAdmin: payload.isAdmin,
      accessVia: payload.accessVia,
      trialEndsAt: payload.trialEndsAt,
    };
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

  // Триал / выданный вручную доступ истёк — закрыто, пока не оплатят. Проверка
  // по времени в токене, без обращения к БД (middleware работает на Edge).
  const timeLimited = payload.accessVia === "trial" || payload.accessVia === "comp";
  const timedExpired =
    timeLimited &&
    typeof payload.trialEndsAt === "number" &&
    payload.trialEndsAt > 0 &&
    payload.trialEndsAt * 1000 < Date.now();
  const denied = !payload.hasAccess || timedExpired;

  if (denied) {
    // Саму страницу оплаты и её API всегда оставляем доступными.
    if (pathname === "/billing" || pathname.startsWith("/api/billing/")) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Требуется оплата", code: "payment_required" }, { status: 402 });
    }
    return NextResponse.redirect(new URL("/billing", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};
