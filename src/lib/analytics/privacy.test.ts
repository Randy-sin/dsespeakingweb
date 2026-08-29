import { describe, expect, it } from "vitest";
import { shouldTrackProductAnalytics } from "./privacy";

describe("product analytics privacy signals", () => {
  it("honors browser Do Not Track", () => {
    expect(shouldTrackProductAnalytics({ doNotTrack: "1", optOutValue: null })).toBe(false);
    expect(shouldTrackProductAnalytics({ doNotTrack: "yes", optOutValue: null })).toBe(false);
  });

  it("honors the local opt-out flag", () => {
    expect(shouldTrackProductAnalytics({ doNotTrack: "0", optOutValue: "1" })).toBe(false);
  });

  it("tracks only when neither signal opts out", () => {
    expect(shouldTrackProductAnalytics({ doNotTrack: "0", optOutValue: null })).toBe(true);
  });
});
