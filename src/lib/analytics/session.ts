export const PRODUCT_ANALYTICS_SESSION_COOKIE = "dse_analytics_session";
export const PRODUCT_ANALYTICS_SESSION_MAX_AGE_SECONDS = 30 * 60;
export const PRODUCT_ANALYTICS_OPT_OUT_COOKIE = "dse_analytics_opt_out";
export const PRODUCT_ANALYTICS_OPT_OUT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAnalyticsSessionId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function readCookie(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== cookieName) continue;
    const rawValue = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function readAnalyticsSessionCookie(request: Request): string | undefined {
  const value = readCookie(request, PRODUCT_ANALYTICS_SESSION_COOKIE);
  return isValidAnalyticsSessionId(value) ? value : undefined;
}

export function hasAnalyticsServerOptOut(request: Request): boolean {
  return readCookie(request, PRODUCT_ANALYTICS_OPT_OUT_COOKIE) === "1";
}

export async function hashAnalyticsSession(sessionId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionId));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
