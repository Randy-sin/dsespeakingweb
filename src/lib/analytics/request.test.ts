import { describe, expect, it } from "vitest";
import {
  MAX_PRODUCT_EVENT_BODY_BYTES,
  PRODUCT_ANALYTICS_HEADER,
  readRequestTextWithinLimit,
  validateAnalyticsRequestHeaders,
} from "./request";

function eventRequest(body: string, headers?: HeadersInit) {
  return new Request("https://dsespeaking.com/api/analytics/events", {
    method: "POST",
    body,
    headers: {
      Origin: "https://dsespeaking.com",
      "Sec-Fetch-Site": "same-origin",
      "Content-Type": "application/json",
      [PRODUCT_ANALYTICS_HEADER]: "1",
      ...headers,
    },
  });
}

describe("analytics request validation", () => {
  it("accepts only same-origin, browser-originated JSON with the custom header", () => {
    expect(validateAnalyticsRequestHeaders(eventRequest("{}"), "event")).toEqual({ ok: true });
    const requestWithoutFetchMetadata = eventRequest("{}");
    requestWithoutFetchMetadata.headers.delete("Sec-Fetch-Site");
    expect(validateAnalyticsRequestHeaders(requestWithoutFetchMetadata, "event")).toEqual({ ok: true });
    expect(
      validateAnalyticsRequestHeaders(eventRequest("{}", { Origin: "https://attacker.example" }), "event"),
    ).toEqual({ ok: false, status: 403 });
    expect(
      validateAnalyticsRequestHeaders(eventRequest("{}", { "Sec-Fetch-Site": "cross-site" }), "event"),
    ).toEqual({ ok: false, status: 403 });
    expect(
      validateAnalyticsRequestHeaders(eventRequest("{}", { "Content-Type": "text/plain" }), "event"),
    ).toEqual({ ok: false, status: 415 });
    expect(
      validateAnalyticsRequestHeaders(eventRequest("{}", { [PRODUCT_ANALYTICS_HEADER]: "" }), "event"),
    ).toEqual({ ok: false, status: 403 });
  });

  it("allows a protected opt-out request without requiring a JSON content type", () => {
    const request = new Request("https://dsespeaking.com/api/analytics/events", {
      method: "DELETE",
      headers: {
        Origin: "https://dsespeaking.com",
        "Sec-Fetch-Site": "same-origin",
        [PRODUCT_ANALYTICS_HEADER]: "1",
      },
    });
    expect(validateAnalyticsRequestHeaders(request, "opt-out")).toEqual({ ok: true });
  });

  it("reads a body below the limit", async () => {
    const body = "x".repeat(MAX_PRODUCT_EVENT_BODY_BYTES);
    await expect(readRequestTextWithinLimit(eventRequest(body))).resolves.toBe(body);
  });

  it("rejects a streamed body above the limit", async () => {
    const body = "x".repeat(MAX_PRODUCT_EVENT_BODY_BYTES + 1);
    await expect(readRequestTextWithinLimit(eventRequest(body))).resolves.toBeNull();
  });

  it("rejects an oversized declared content length before reading", async () => {
    const request = eventRequest("{}", {
      "Content-Length": String(MAX_PRODUCT_EVENT_BODY_BYTES + 1),
    });
    await expect(readRequestTextWithinLimit(request)).resolves.toBeNull();
  });
});
