import { describe, expect, it } from "vitest";
import {
  PRODUCT_EVENT_NAMES,
  bucketDuration,
  bucketLatency,
  classifyAnalyticsOutcome,
  createProductEventEnvelope,
  parseProductEventEnvelope,
} from "./events";

const validEnvelope = {
  id: "2fb272d4-5cd3-4c96-86e5-fbe6a8381265",
  name: "recording_completed",
  surface: "practice",
  mode: "individual-response",
  context: "practice-session",
  outcome: "success",
  inputSource: "voice",
  durationBucket: "31-60s",
  authState: "authenticated",
  contentId: "making-choices",
  round: 1,
  schemaVersion: 1,
};

describe("product event validation", () => {
  it("accepts every canonical event name", () => {
    for (const name of PRODUCT_EVENT_NAMES) {
      expect(parseProductEventEnvelope({ ...validEnvelope, name })).not.toBeNull();
    }
  });

  it.each([
    "transcript",
    "audio",
    "prompt",
    "task",
    "url",
    "query",
    "referrer",
    "email",
    "userId",
    "ip",
    "userAgent",
    "error",
  ])("rejects forbidden or unknown field %s", (field) => {
    expect(parseProductEventEnvelope({ ...validEnvelope, [field]: "private data" })).toBeNull();
  });

  it("rejects invalid enum values", () => {
    expect(parseProductEventEnvelope({ ...validEnvelope, surface: "admin" })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, mode: "meeting-room" })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, outcome: "maybe" })).toBeNull();
  });

  it("rejects content IDs that are long, URLs, or query-like", () => {
    expect(parseProductEventEnvelope({ ...validEnvelope, contentId: "x".repeat(129) })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, contentId: "https://example.com" })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, contentId: "paper?student=1" })).toBeNull();
  });

  it("rejects bad identifiers, schema versions, and rounds", () => {
    expect(parseProductEventEnvelope({ ...validEnvelope, id: "not-a-uuid" })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, schemaVersion: 2 })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, round: 0 })).toBeNull();
    expect(parseProductEventEnvelope({ ...validEnvelope, round: 1.5 })).toBeNull();
  });

  it("omits typed optional fields that are undefined without hiding unknown fields", () => {
    expect(
      createProductEventEnvelope(
        { name: "practice_started", contentId: undefined },
        validEnvelope.id,
      ),
    ).toEqual({ id: validEnvelope.id, name: "practice_started", schemaVersion: 1 });
    expect(
      createProductEventEnvelope(
        { name: "practice_started", secret: undefined } as never,
        validEnvelope.id,
      ),
    ).toBeNull();
  });
});

describe("analytics buckets", () => {
  it("uses stable, non-identifying duration buckets", () => {
    expect(bucketDuration(0)).toBe("under-15s");
    expect(bucketDuration(15)).toBe("15-30s");
    expect(bucketDuration(31)).toBe("31-60s");
    expect(bucketDuration(121)).toBe("over-120s");
    expect(bucketDuration(-1)).toBeUndefined();
  });

  it("uses stable latency buckets and coarse outcomes", () => {
    expect(bucketLatency(999)).toBe("under-1s");
    expect(bucketLatency(1_000)).toBe("1-3s");
    expect(bucketLatency(30_000)).toBe("over-30s");
    expect(classifyAnalyticsOutcome(202)).toBe("success");
    expect(classifyAnalyticsOutcome(429)).toBe("blocked");
    expect(classifyAnalyticsOutcome(500)).toBe("failure");
  });
});
