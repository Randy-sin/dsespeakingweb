import { describe, expect, it } from "vitest";
import { canCompleteVoiceLesson, hasCompletedSpeakingAttempt } from "./voice-first";

describe("voice-first lesson completion", () => {
  it("accepts a real recording without requiring typed words", () => {
    expect(hasCompletedSpeakingAttempt("recorded", 0)).toBe(true);
    expect(canCompleteVoiceLesson({
      recorderState: "recorded",
      fallbackWordCount: 0,
      confirmedSteps: 2,
    })).toBe(true);
  });

  it("does not accept an idle or in-progress recorder", () => {
    expect(canCompleteVoiceLesson({
      recorderState: "idle",
      fallbackWordCount: 100,
      confirmedSteps: 3,
    })).toBe(false);
    expect(canCompleteVoiceLesson({
      recorderState: "recording",
      fallbackWordCount: 100,
      confirmedSteps: 3,
    })).toBe(false);
  });

  it("keeps typing behind the explicit microphone-failure fallback", () => {
    expect(canCompleteVoiceLesson({
      recorderState: "text",
      fallbackWordCount: 11,
      confirmedSteps: 2,
    })).toBe(false);
    expect(canCompleteVoiceLesson({
      recorderState: "text",
      fallbackWordCount: 12,
      confirmedSteps: 2,
    })).toBe(true);
  });

  it("requires an honest review after the speaking attempt", () => {
    expect(canCompleteVoiceLesson({
      recorderState: "recorded",
      fallbackWordCount: 0,
      confirmedSteps: 1,
    })).toBe(false);
  });
});
