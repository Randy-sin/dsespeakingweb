import { describe, expect, it } from "vitest";
import { buildBasicAssessmentCoaching, buildBasicDiscussionDrill } from "./basic-coaching";

describe("basic coaching fallback", () => {
  it("reports only observable transcript signals", () => {
    const result = buildBasicAssessmentCoaching(
      "individual-response",
      "First, I would visit the museum because I can see real objects. For example, an old map can make history easier to understand. Overall, the visit would be more memorable and I could discuss what I learned with my classmates afterwards.",
    );

    expect(result.kind).toBe("assessment");
    expect(result.wordCount).toBeGreaterThanOrEqual(40);
    expect(result.checks.find((check) => check.id === "reason")?.found).toBe(true);
    expect(result.checks.find((check) => check.id === "example")?.found).toBe(true);
    expect(result.caveat).toContain("不是 AI 評分");
  });

  it("does not infer missing quality signals", () => {
    const result = buildBasicAssessmentCoaching("individual-response", "I choose the museum.");

    expect(result.checks.find((check) => check.id === "length")?.found).toBe(false);
    expect(result.checks.find((check) => check.id === "reason")?.found).toBe(false);
    expect(result.nextSteps).toContain("再補一個完整理由，令回答達到約 40 至 70 個英文詞。");
  });

  it("returns a drill rather than an AI teammate reply", () => {
    const result = buildBasicDiscussionDrill("I agree with your point. What do you think?");

    expect(result.kind).toBe("discussion");
    expect(result.detectedMoves).toEqual(["i agree", "your point", "what do you think"]);
    expect(result.sentenceFrames).toHaveLength(3);
    expect(result.caveat).toContain("不是 AI 組員");
  });
});
