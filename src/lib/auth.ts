import { createHmac, createHash } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "sb_session";
export const VIEWAS_COOKIE = "sb_viewas";
const SECRET = process.env.NEXTAUTH_SECRET ?? "smart-bizon-secret-2026";

export interface SessionPayload {
  userId: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  isAdmin: boolean;
  hasAccess: boolean;
  exp: number;
}

/**
 * What every route actually works with. Same shape as SessionPayload, plus
 * the real identity behind an admin's "view as" impersonation (if any) —
 * userId/isAdmin above are swapped to the impersonated user's while active,
 * so every existing `session.userId` / `session.isAdmin` check keeps working
 * unmodified and correctly scopes to whichever account is being viewed.
 */
export interface EffectiveSession extends SessionPayload {
  realUserId: string;
  realIsAdmin: boolean;
  viewingAsUserId: string | null;
}

function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function fromB64url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const body = b64url(JSON.stringify({ ...payload, exp }));
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(fromB64url(body)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Tokens issued before multi-tenancy was added don't carry userId. Reject
    // them explicitly rather than letting `undefined` silently disable
    // Prisma's `where: { userId }` filters (Prisma ignores undefined values,
    // which would turn a "my projects only" query into "all projects").
    if (!payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyTelegramData(data: Record<string, string>): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;
  const authDate = parseInt(rest.auth_date ?? "0");
  if (Date.now() / 1000 - authDate > 86400) return false;
  const dataCheckString = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join("\n");
  const secretKey = createHash("sha256").update(process.env.TELEGRAM_BOT_TOKEN!).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return expected === hash;
}

/** Decodes only the real, logged-in identity — never swapped by "view as". */
export async function getRawSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * The session every route should use. For a plain user this is just their
 * own identity. For an admin who has picked "view as" (Telegram's login
 * widget has no way for a site to force a fresh account picker, so this is
 * how one person manages multiple client accounts on one device instead) it
 * transparently swaps userId/isAdmin to the target account's, so ownership
 * checks elsewhere in the codebase scope to that account without change.
 */
export async function getSession(): Promise<EffectiveSession | null> {
  const payload = await getRawSession();
  if (!payload) return null;

  const base: EffectiveSession = {
    ...payload,
    realUserId: payload.userId,
    realIsAdmin: payload.isAdmin,
    viewingAsUserId: null,
  };

  if (payload.isAdmin) {
    const cookieStore = await cookies();
    const viewAsUserId = cookieStore.get(VIEWAS_COOKIE)?.value;
    if (viewAsUserId && viewAsUserId !== payload.userId) {
      return { ...base, userId: viewAsUserId, isAdmin: false, viewingAsUserId: viewAsUserId };
    }
  }

  return base;
}
