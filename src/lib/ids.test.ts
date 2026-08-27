import { describe, expect, it } from "vitest";
import { parseOptionalUuid } from "./ids";

describe("parseOptionalUuid", () => {
  it("accepts a valid paper id and an omitted value", () => {
    expect(parseOptionalUuid("123e4567-e89b-42d3-a456-426614174000", "paperId")).toBe("123e4567-e89b-42d3-a456-426614174000");
    expect(parseOptionalUuid(undefined, "paperId")).toBeNull();
  });

  it("rejects malformed ids before they reach a database query", () => {
    expect(() => parseOptionalUuid("../../paper", "paperId")).toThrow("paperId is invalid");
  });
});
