import { describe, expect, it } from "vitest";
import { isDoubaoRealtimeEntitlementResponse } from "./doubao-realtime";

describe("Doubao realtime entitlement errors", () => {
  it("recognizes only the explicit resource-not-granted response", () => {
    expect(isDoubaoRealtimeEntitlementResponse(
      403,
      '{"error":"[resource_id=volc.speech.dialog] requested resource not granted"}',
    )).toBe(true);
    expect(isDoubaoRealtimeEntitlementResponse(401, '{"error":"requested resource not granted"}')).toBe(false);
    expect(isDoubaoRealtimeEntitlementResponse(403, '{"error":"invalid access token"}')).toBe(false);
    expect(isDoubaoRealtimeEntitlementResponse(403, "not json")).toBe(false);
  });
});
