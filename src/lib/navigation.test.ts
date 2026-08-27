import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./navigation";

describe("sanitizeNextPath", () => {
  it("keeps a local practice route and its selected topic", () => {
    expect(sanitizeNextPath("/practice/group-discussion/session?topic=visit")).toBe(
      "/practice/group-discussion/session?topic=visit",
    );
  });

  it("rejects external and backslash-based redirects", () => {
    expect(sanitizeNextPath("https://example.com/steal")).toBe("/learn");
    expect(sanitizeNextPath("//example.com/steal")).toBe("/learn");
    expect(sanitizeNextPath("/\\example.com/steal")).toBe("/learn");
  });
});
