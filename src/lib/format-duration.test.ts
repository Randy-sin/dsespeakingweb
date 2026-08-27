import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formats a full preparation minute conventionally", () => {
    expect(formatDuration(60)).toBe("01:00");
  });

  it("clamps negative and fractional values", () => {
    expect(formatDuration(-1)).toBe("00:00");
    expect(formatDuration(9.9)).toBe("00:09");
  });
});
