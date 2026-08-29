"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder, type RecorderState } from "@/features/recording/voice-recorder";
import { trackProductEvent } from "@/lib/analytics/client";
import { completeLesson } from "@/lib/learning/store";
import type { Lesson } from "@/lib/learning/types";
import { canCompleteVoiceLesson, hasCompletedSpeakingAttempt } from "@/lib/learning/voice-first";

export function LessonPractice({ lesson }: { lesson: Lesson }) {
  const [fallbackAnswer, setFallbackAnswer] = useState("");
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recorderKey, setRecorderKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<string[]>([]);
  const completionTrackedRef = useRef(false);
  const practiceStartedTrackedRef = useRef(false);
  const nextHref = lesson.mode === "group-discussion" ? "/practice/group-discussion" : `/practice/individual-response/session?type=${lesson.slug}`;
  const fallbackWordCount = fallbackAnswer.trim().split(/\s+/).filter(Boolean).length;
  const targetSteps = lesson.steps.slice(0, 3);
  const hasAttempt = hasCompletedSpeakingAttempt(recorderState, fallbackWordCount);
  const enoughBehaviours = confirmedSteps.length >= 2;
  const readyToComplete = canCompleteVoiceLesson({
    recorderState,
    fallbackWordCount,
    confirmedSteps: confirmedSteps.length,
  });

  useEffect(() => {
    if (practiceStartedTrackedRef.current) return;
    practiceStartedTrackedRef.current = true;
    trackProductEvent({
      name: "practice_started",
      surface: "learn",
      context: "lesson",
      contentId: lesson.slug,
      mode: lesson.mode,
    });
  }, [lesson.mode, lesson.slug]);

  const markComplete = () => {
    if (!readyToComplete) return;
    completeLesson(lesson.slug, lesson.duration);
    if (!completionTrackedRef.current) {
      completionTrackedRef.current = true;
      trackProductEvent({
        name: "lesson_completed",
        surface: "learn",
        context: "lesson",
        contentId: lesson.slug,
        mode: lesson.mode,
        outcome: "success",
        inputSource: recorderState === "text" ? "text-fallback" : "voice",
      });
    }
    setCompleted(true);
  };

  const resetAttempt = () => {
    setRecorderKey((value) => value + 1);
    setRecorderState("idle");
    setFallbackAnswer("");
    setConfirmedSteps([]);
    setCompleted(false);
  };

  const clearReview = () => {
    setFallbackAnswer("");
    setConfirmedSteps([]);
    setCompleted(false);
  };

  const toggleStep = (step: string) => {
    setConfirmedSteps((current) => current.includes(step) ? current.filter((item) => item !== step) : [...current, step]);
  };

  return (
    <section className="border-t border-[#bdb3a2] pt-9">
      <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ad3f29] font-mono text-xs text-white">04</span><div><p className="eyebrow text-[#ad3f29]">Try it now</p><h2 className="mt-2 font-serif text-3xl">輪到你直接說出來</h2></div></div>
      <div className="paper-surface mt-7 p-5 sm:p-7"><p className="eyebrow text-[#665f55]">Prompt</p><p className="mt-4 font-serif text-2xl leading-9">{lesson.prompt}</p></div>

      <div className="mt-7">
        <p className="mb-3 text-sm font-semibold text-[#26352a]">不用先寫稿。按下麥克風，說 20–30 秒。</p>
        <VoiceRecorder
          key={recorderKey}
          maxSeconds={30}
          mode={lesson.mode}
          task={lesson.prompt}
          showAccountOptions={false}
          analyticsContext={{ surface: "learn", context: "lesson", contentId: lesson.slug }}
          onStateChange={setRecorderState}
          onRecordingStart={clearReview}
          onReset={clearReview}
        />
      </div>

      {recorderState === "text" ? (
        <div className="mt-5 border-l-2 border-[#ad3f29] pl-5">
          <label htmlFor="practice-fallback" className="block text-sm font-semibold">只有麥克風不可用時，才使用文字後備</label>
          <p id="practice-fallback-help" className="mt-2 text-xs leading-5 text-[#665f55]">至少 12 個英文詞，模擬你原本會說的答案。</p>
          <Textarea id="practice-fallback" aria-describedby="practice-fallback-help practice-check-status" value={fallbackAnswer} onChange={(event) => { setFallbackAnswer(event.target.value); setCompleted(false); }} placeholder="Type only because recording is unavailable…" className="mt-3 min-h-28 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7 focus-visible:ring-[#48634c]" />
        </div>
      ) : null}

      <fieldset className="mt-5 border border-[#c9c0b1] bg-white/35 p-4">
        <legend className="px-1 text-sm font-semibold text-[#26352a]">聽完自己的回答，再確認目標行為</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {targetSteps.map((step) => (
            <label key={step} className={`flex min-h-12 items-start gap-3 border p-3 text-xs leading-5 ${hasAttempt ? "cursor-pointer" : "cursor-not-allowed opacity-55"} ${confirmedSteps.includes(step) ? "border-[#48634c] bg-[#edf0e8]" : "border-[#d7cebd] bg-[#faf7ef]"}`}>
              <input type="checkbox" disabled={!hasAttempt} checked={confirmedSteps.includes(step)} onChange={() => toggleStep(step)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#48634c]" />
              <span>{step}</span>
            </label>
          ))}
        </div>
        <p id="practice-check-status" aria-live="polite" className="mt-3 text-xs leading-5 text-[#665f55]">
          {!hasAttempt
            ? recorderState === "text"
              ? `文字後備還差 ${Math.max(0, 12 - fallbackWordCount)} 個英文詞。`
              : "完成一次錄音後，這裡才會開放；不需要先輸入文字。"
            : enoughBehaviours
              ? "已完成開口練習，並確認至少兩項目標行為。"
              : "錄音已完成。回聽後確認至少兩項真正做到的行為。"}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[#6d695f]">這是結構自檢，不是 AI 或 HKEAA 評分；不確定就先不要勾。</p>
      </fieldset>

      {!completed ? (
        <Button type="button" onClick={markComplete} className="mt-5 h-12 w-full rounded-full bg-[#172019] px-6 text-white sm:w-auto" disabled={!readyToComplete}>完成這次開口練習<Check className="ml-2 h-4 w-4" /></Button>
      ) : (
        <div className="mt-5 border border-[#92a194] bg-[#e2e9e2] p-5"><div className="flex gap-3"><Check className="h-5 w-5 text-[#48634c]" /><div><p className="font-semibold">這一課已完成</p><p className="mt-1 text-sm leading-6 text-[#5e5b53]">你已經真正說過一次，也確認了至少兩項目標行為。下一步用同類題目完成計時練習。</p></div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button asChild className="rounded-full bg-[#48634c] text-white"><Link href={nextHref}>進入計時練習<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="ghost" onClick={resetAttempt} className="rounded-full"><RotateCcw className="mr-2 h-4 w-4" />再說一次</Button></div></div>
      )}
    </section>
  );
}
