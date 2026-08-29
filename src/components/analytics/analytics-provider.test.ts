import { describe, expect, it } from "vitest";
import {
  ANALYTICS_OPT_OUT_KEY,
  hasAnalyticsOptOut,
  isPrivateAnalyticsPath,
  sanitizeAnalyticsUrl,
  shouldBlockAnalytics,
  surfaceForPath,
} from "./analytics-provider";

function storageWith(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem(key) {
      return key === ANALYTICS_OPT_OUT_KEY ? value : null;
    },
  };
}

describe("analytics privacy helpers", () => {
  it("removes search parameters and fragments from analytics URLs", () => {
    expect(
      sanitizeAnalyticsUrl(
        "https://dsespeaking.com/practice/session?paper=secret#answer",
        "https://dsespeaking.com/",
      ),
    ).toBe("https://dsespeaking.com/practice/session");
  });

  it("does not report private admin paths", () => {
    expect(isPrivateAnalyticsPath(
      "https://dsespeaking.com/admin/analytics?days=7",
      "https://dsespeaking.com/",
    )).toBe(true);
    expect(isPrivateAnalyticsPath(
      "https://dsespeaking.com/practice/individual-response",
      "https://dsespeaking.com/",
    )).toBe(false);
  });

  it("maps landing paths only to coarse product surfaces", () => {
    expect(surfaceForPath("/")).toBe("home");
    expect(surfaceForPath("/practice/individual-response/session")).toBe("practice");
    expect(surfaceForPath("/papers/2025-paper-1")).toBe("papers");
    expect(surfaceForPath("/progress")).toBeUndefined();
  });

  it("resolves paths without retaining the fallback URL query", () => {
    expect(
      sanitizeAnalyticsUrl(
        "/learn/group-discussion?source=campaign",
        "https://dsespeaking.com/current?private=value",
      ),
    ).toBe("https://dsespeaking.com/learn/group-discussion");
  });

  it("blocks analytics for either a stored opt-out or Do Not Track", () => {
    expect(hasAnalyticsOptOut(storageWith("1"))).toBe(true);
    expect(shouldBlockAnalytics("0", storageWith("1"))).toBe(true);
    expect(shouldBlockAnalytics("1", storageWith(null))).toBe(true);
    expect(shouldBlockAnalytics("yes", storageWith(null))).toBe(true);
    expect(shouldBlockAnalytics("0", storageWith(null))).toBe(false);
  });

  it("fails closed when browser storage is unavailable", () => {
    const unavailableStorage: Pick<Storage, "getItem"> = {
      getItem() {
        throw new Error("storage unavailable");
      },
    };

    expect(hasAnalyticsOptOut(unavailableStorage)).toBe(true);
  });
});
