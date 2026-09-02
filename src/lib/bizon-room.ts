// Talks to a Bizon365 webinar room's public entry page directly (not the
// analytics API — this is the same page real visitors land on). Used to:
//  1. mirror the room's live title/speaker/date on our own entry page, and
//  2. replay the visitor's name+phone into Bizon's own `authorize` endpoint
//     so their browser ends up with a valid session for that room, without
//     them ever seeing Bizon's own (small, busy) entry form.
//
// Reverse-engineered from the room page's own client-side JS (there is no
// documented public API for this): the login form has no `action` — it's a
// jQuery POST to `{roomPath}/authorize?_csrf=` with url-encoded fields
// (username, phone in E.164, plus a handful of always-empty tracking
// fields Bizon still expects present) and `withCredentials`. On success it
// just sets a session cookie and reloads the same URL.

export interface BizonRoomInfo {
  roomUrl: string; // normalized, no trailing slash
  title: string | null;
  speaker: string | null;
  dateLabel: string | null;
}

/** Strips query/hash and a trailing slash so we always build authorize/redirect URLs the same way. */
export function normalizeBizonRoomUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (!/bizon365\.(ru|com)$/i.test(u.hostname.replace(/^online\./, ""))) return null;
    u.search = "";
    u.hash = "";
    let path = u.pathname.replace(/\/+$/, "");
    if (!path) return null;
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

export async function fetchBizonRoomInfo(roomUrl: string): Promise<BizonRoomInfo> {
  const info: BizonRoomInfo = { roomUrl, title: null, speaker: null, dateLabel: null };
  try {
    const res = await fetch(roomUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SmartBizonAI/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return info;
    const html = await res.text();

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) info.title = decodeHtml(titleMatch[1].trim());

    const speakerMatch = html.match(/id="roomSpeakers">([^<]*)</i);
    if (speakerMatch) info.speaker = decodeHtml(speakerMatch[1].trim());

    const dateMatch = html.match(/class="roomDate">([^<]*)</i);
    if (dateMatch) info.dateLabel = decodeHtml(dateMatch[1].trim());
  } catch {
    // best-effort — the entry page still works with just the URL
  }
  return info;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Normalizes free-typed phone input to E.164, defaulting to the +7 (KZ/RU) country code. */
export function toE164(rawPhone: string, defaultCountryCode = "7"): string | null {
  const digits = rawPhone.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    const onlyDigits = digits.slice(1).replace(/\D/g, "");
    return onlyDigits.length >= 9 ? `+${onlyDigits}` : null;
  }
  let d = digits.replace(/\D/g, "");
  if (d.startsWith("8") && defaultCountryCode === "7" && d.length === 11) d = "7" + d.slice(1);
  if (!d.startsWith(defaultCountryCode)) d = defaultCountryCode + d;
  return d.length >= 9 ? `+${d}` : null;
}
