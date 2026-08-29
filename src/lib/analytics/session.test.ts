import { describe, expect, it } from "vitest";
import {
  PRODUCT_ANALYTICS_SESSION_COOKIE,
  PRODUCT_ANALYTICS_OPT_OUT_COOKIE,
  hasAnalyticsServerOptOut,
  hashAnalyticsSession,
  readAnalyticsSessionCookie,
} from "./session";

describe("anonymous analytics sessions", () => {
  it("reads only valid random session cookies", () => {
    const value = "2fb272d4-5cd3-4c96-86e5-fbe6a8381265";
    const request = new Request("https://dsespeaking.com/api/analytics/events", {
      headers: { cookie: `other=1; ${PRODUCT_ANALYTICS_SESSION_COOKIE}=${value}` },
    });
    expect(readAnalyticsSessionCookie(request)).toBe(value);

    const invalid = new Request("https://dsespeaking.com/api/analytics/events", {
      headers: { cookie: `${PRODUCT_ANALYTICS_SESSION_COOKIE}=visitor@example.com` },
    });
    expect(readAnalyticsSessionCookie(invalid)).toBeUndefined();
  });

  it("recognizes only the explicit server-visible opt-out value", () => {
    const optedOut = new Request("https://dsespeaking.com/api/analytics/events", {
      headers: { cookie: `${PRODUCT_ANALYTICS_OPT_OUT_COOKIE}=1` },
    });
    const notOptedOut = new Request("https://dsespeaking.com/api/analytics/events", {
      headers: { cookie: `${PRODUCT_ANALYTICS_OPT_OUT_COOKIE}=0` },
    });
    expect(hasAnalyticsServerOptOut(optedOut)).toBe(true);
    expect(hasAnalyticsServerOptOut(notOptedOut)).toBe(false);
  });

  it("produces deterministic HMAC-SHA256 hashes without exposing the session ID", async () => {
    const sessionId = "2fb272d4-5cd3-4c96-86e5-fbe6a8381265";
    const first = await hashAnalyticsSession(sessionId, "a-secret-value-that-is-never-persisted");
    const second = await hashAnalyticsSession(sessionId, "a-secret-value-that-is-never-persisted");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain(sessionId);
  });
});
