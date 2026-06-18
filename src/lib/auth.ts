import { createHmac, createHash } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "sb_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "smart-bizon-secret-2026";

export interface SessionPayload {
  telegramId: string;
  username?: string;
  firstName?: string;
  isAdmin: boolean;
  hasAccess: boolean;
  exp: number;
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

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
