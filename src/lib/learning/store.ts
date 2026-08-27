"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { LearnerProfile, LearningPlan, LearningProgress, WeakArea } from "@/lib/learning/types";

const PROFILE_KEY = "dse-learning-profile:v1";
const PROGRESS_KEY = "dse-learning-progress:v1";
const STORE_EVENT = "dse-learning-store-change";

const defaultProgress: LearningProgress = {
  completedLessons: [],
  practiceCount: 0,
  practiceMinutes: 0,
  lastActiveAt: null,
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

function getStorageSnapshot(key: string, fallback: string) {
  return () => window.localStorage.getItem(key) ?? fallback;
}

function dispatchChange() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function saveLearnerProfile(profile: LearnerProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  dispatchChange();
}

export function saveLearningProgress(progress: LearningProgress) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  dispatchChange();
}

export function useLearnerProfile() {
  const raw = useSyncExternalStore(subscribe, getStorageSnapshot(PROFILE_KEY, "null"), () => "null");
  return useMemo(() => {
    try {
      return JSON.parse(raw) as LearnerProfile | null;
    } catch {
      return null;
    }
  }, [raw]);
}

export function useLearningProgress() {
  const fallback = JSON.stringify(defaultProgress);
  const raw = useSyncExternalStore(subscribe, getStorageSnapshot(PROGRESS_KEY, fallback), () => fallback);
  return useMemo(() => {
    try {
      return JSON.parse(raw) as LearningProgress;
    } catch {
      return defaultProgress;
    }
  }, [raw]);
}

export function completeLesson(slug: string, duration: number) {
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  let current = defaultProgress;
  try {
    current = raw ? (JSON.parse(raw) as LearningProgress) : defaultProgress;
  } catch {
    current = defaultProgress;
  }
  const completedLessons = current.completedLessons.includes(slug)
    ? current.completedLessons
    : [...current.completedLessons, slug];
  saveLearningProgress({
    ...current,
    completedLessons,
    practiceMinutes: current.practiceMinutes + duration,
    lastActiveAt: new Date().toISOString(),
  });
}

export function recordPractice(duration: number) {
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  let current = defaultProgress;
  try {
    current = raw ? (JSON.parse(raw) as LearningProgress) : defaultProgress;
  } catch {
    current = defaultProgress;
  }
  saveLearningProgress({
    ...current,
    practiceCount: current.practiceCount + 1,
    practiceMinutes: current.practiceMinutes + Math.max(1, Math.ceil(duration / 60)),
    lastActiveAt: new Date().toISOString(),
  });
}

const weakAreaLabels: Record<WeakArea, string> = {
  ideas: "臨場想不到內容",
  structure: "答案結構不清楚",
  interaction: "接不上別人的觀點",
  language: "詞彙和句式不夠準確",
  delivery: "發音或流暢度不穩",
  timing: "時間控制困難",
};

export function getWeakAreaLabel(area: WeakArea) {
  return weakAreaLabels[area];
}

export function buildLearningPlan(profile: LearnerProfile): LearningPlan {
  const primary = profile.weakAreas[0] ?? "interaction";

  if (primary === "interaction") {
    return {
      mode: "group-discussion",
      lessonSlug: "respond-and-build",
      title: "先練：回應並加入新資訊",
      reason: "你最想改善的是接住其他考生的觀點。這一課會先讓每次發言都形成真正互動。",
      weeklyTasks: ["完成 8 分鐘互動技巧課", "做 2 次 30 秒回應練習", "用一份真題完成 GD 準備"],
    };
  }

  if (primary === "structure" || primary === "timing") {
    return {
      mode: "individual-response",
      lessonSlug: "making-choices",
      title: "先練：一分鐘答案結構",
      reason: "你希望答案更有結構或更準時完成。Making Choices 可以用最清晰的四步框架建立節奏。",
      weeklyTasks: ["完成 Making Choices 課", "錄製 2 次 60 秒答案", "比較兩次答案的開頭與結尾"],
    };
  }

  if (primary === "ideas") {
    return {
      mode: "group-discussion",
      lessonSlug: "elaborate-with-evidence",
      title: "先練：把一個想法展開",
      reason: "你不是需要更多空泛句型，而是需要把一個觀點變成原因、影響和例子。",
      weeklyTasks: ["完成論述技巧課", "為 3 個題目各寫一條因果鏈", "錄製一次 30 秒完整論點"],
    };
  }

  return {
    mode: "individual-response",
    lessonSlug: "giving-opinions",
    title: "先練：清楚表達立場",
    reason: "先建立穩定的立場和論證骨架，再逐步改善詞彙、發音與自然度。",
    weeklyTasks: ["完成 Giving Opinions 課", "跟讀 3 個示範句", "錄製一次 60 秒答案"],
  };
}
