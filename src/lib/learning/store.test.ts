import { describe, expect, it } from "vitest";
import { applyLessonCompletion } from "./store";
import type { LearningProgress } from "./types";

const initial: LearningProgress = {
  completedLessons: [],
  practiceCount: 0,
  practiceMinutes: 4,
  lastActiveAt: null,
};

describe("applyLessonCompletion", () => {
  it("adds the lesson duration the first time", () => {
    const completed = applyLessonCompletion(initial, "respond-and-build", 8, "2026-08-27T00:00:00Z");
    expect(completed.completedLessons).toEqual(["respond-and-build"]);
    expect(completed.practiceMinutes).toBe(12);
  });

  it("does not award the same lesson minutes twice", () => {
    const once = applyLessonCompletion(initial, "respond-and-build", 8, "2026-08-27T00:00:00Z");
    const twice = applyLessonCompletion(once, "respond-and-build", 8, "2026-08-27T00:01:00Z");
    expect(twice.completedLessons).toEqual(["respond-and-build"]);
    expect(twice.practiceMinutes).toBe(12);
  });
});
