export const MAX_PRODUCT_EVENT_BODY_BYTES = 1_900;
export const PRODUCT_ANALYTICS_HEADER = "X-DSE-Analytics";
export const PRODUCT_ANALYTICS_HEADER_VALUE = "1";

export type AnalyticsRequestKind = "event" | "opt-out";

export type AnalyticsRequestHeaderResult =
  | { ok: true }
  | { ok: false; status: 403 | 415 };

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

export function validateAnalyticsRequestHeaders(
  request: Request,
  kind: AnalyticsRequestKind,
): AnalyticsRequestHeaderResult {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const analyticsHeader = request.headers.get(PRODUCT_ANALYTICS_HEADER);

  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    (fetchSite !== null && fetchSite !== "same-origin") ||
    analyticsHeader !== PRODUCT_ANALYTICS_HEADER_VALUE
  ) {
    return { ok: false, status: 403 };
  }

  if (kind === "event" && !isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415 };
  }

  return { ok: true };
}

export async function readRequestTextWithinLimit(
  request: Request,
  maxBytes = MAX_PRODUCT_EVENT_BODY_BYTES,
): Promise<string | null> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0 || parsedLength > maxBytes) return null;
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let result = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteLength += chunk.value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        return null;
      }
      result += decoder.decode(chunk.value, { stream: true });
    }
    result += decoder.decode();
    return result;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
