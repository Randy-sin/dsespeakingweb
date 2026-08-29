import { NextResponse } from "next/server";
import { parseProductEventEnvelope } from "@/lib/analytics/events";
import {
  readRequestTextWithinLimit,
  validateAnalyticsRequestHeaders,
} from "@/lib/analytics/request";
import { ingestProductEvent } from "@/lib/analytics/server";
import {
  PRODUCT_ANALYTICS_SESSION_COOKIE,
  PRODUCT_ANALYTICS_SESSION_MAX_AGE_SECONDS,
  PRODUCT_ANALYTICS_OPT_OUT_COOKIE,
  PRODUCT_ANALYTICS_OPT_OUT_MAX_AGE_SECONDS,
  readAnalyticsSessionCookie,
} from "@/lib/analytics/session";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

function emptyResponse(status: number): NextResponse {
  return new NextResponse(null, { status, headers: NO_STORE_HEADERS });
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: PRODUCT_ANALYTICS_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const headersResult = validateAnalyticsRequestHeaders(request, "event");
  if (!headersResult.ok) return emptyResponse(headersResult.status);

  const body = await readRequestTextWithinLimit(request);
  if (body === null) return emptyResponse(413);

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return emptyResponse(400);
  }

  const event = parseProductEventEnvelope(parsedBody);
  if (!event) return emptyResponse(400);

  const existingSessionId = readAnalyticsSessionCookie(request);
  const sessionId = existingSessionId ?? crypto.randomUUID();
  const result = await ingestProductEvent(event, sessionId);
  if (result !== "accepted") return emptyResponse(503);

  const response = emptyResponse(202);
  response.cookies.set(PRODUCT_ANALYTICS_SESSION_COOKIE, sessionId, sessionCookieOptions());
  response.cookies.set(PRODUCT_ANALYTICS_OPT_OUT_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const headersResult = validateAnalyticsRequestHeaders(request, "opt-out");
  if (!headersResult.ok) return emptyResponse(headersResult.status);

  const response = emptyResponse(204);
  response.cookies.set(PRODUCT_ANALYTICS_SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(PRODUCT_ANALYTICS_OPT_OUT_COOKIE, "1", {
    ...sessionCookieOptions(),
    maxAge: PRODUCT_ANALYTICS_OPT_OUT_MAX_AGE_SECONDS,
  });
  return response;
}
