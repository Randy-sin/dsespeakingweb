"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Lightbulb, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/format-duration";
import type { Lesson } from "@/lib/learning/types";

const PracticeCoach = dynamic(
  () => import("@/features/practice/practice-coach").then((module) => module.PracticeCoach),
  {
    loading: () => (
      <div role="status" className="border border-[#bdb3a2] bg-[#faf7ef] p-6 text-sm text-[#665f55]">
        正在載入錄音與逐字稿工具……
      </div>
    ),
  },
);

const IR_SESSION_DRAFT_PREFIX = "dse-speaking:ir-session:v1";
const DRAFT_TTL_MS = 30 * 60 * 1000;

type IndividualResponseSessionProps = {
  lesson: Lesson;
  paperId?: string;
  returnHref?: string;
  returnLabel?: string;
};

export function IndividualResponseSession({
  lesson,
  paperId,
  returnHref = "/practice/individual-response",
  returnLabel = "重新選擇題型",
}: IndividualResponseSessionProps) {
  const [phase, setPhase] = useState<"ready" | "prepare" | "speak">("ready");
  const [seconds, setSeconds] = useState(60);
  const [notes, setNotes] = useState("");
  const [announcement, setAnnouncement] = useState("題目已準備好。按下按鈕開始一分鐘準備。");
  const prepareHeadingRef = useRef<HTMLHeadingElement>(null);
  const speakHeadingRef = useRef<HTMLHeadingElement>(null);
  const notesRef = useRef("");
  const draftKey = `${IR_SESSION_DRAFT_PREFIX}:${lesson.slug}`;

  const saveSessionDraft = useCallback((nextPhase: "ready" | "prepare" | "speak", nextNotes: string) => {
    window.sessionStorage.setItem(draftKey, JSON.stringify({
      phase: nextPhase,
      notes: nextNotes,
      expiresAt: Date.now() + DRAFT_TTL_MS,
    }));
  }, [draftKey]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(draftKey);
      if (!stored) return;
      const draft = JSON.parse(stored) as { phase?: "ready" | "prepare" | "speak"; notes?: string; expiresAt?: number };
      if (!draft.expiresAt || draft.expiresAt < Date.now()) {
        window.sessionStorage.removeItem(draftKey);
        return;
      }
      window.queueMicrotask(() => {
        notesRef.current = draft.notes ?? "";
        setNotes(draft.notes ?? "");
        if (draft.phase === "speak") {
          setPhase("speak");
          setAnnouncement("已恢復登入前的回答階段與準備筆記。");
        }
      });
    } catch {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    if (phase !== "prepare" || seconds <= 0) return;
    const timeout = window.setTimeout(() => {
      const nextSeconds = Math.max(0, seconds - 1);
      setSeconds(nextSeconds);
      if (nextSeconds === 10) setAnnouncement("準備時間剩下十秒。");
      if (nextSeconds === 0) {
        setAnnouncement("準備時間結束，現在開始回答。你的筆記仍保留在下方。");
        saveSessionDraft("speak", notesRef.current);
        setPhase("speak");
      }
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [phase, saveSessionDraft, seconds]);

  useEffect(() => {
    if (phase === "prepare") prepareHeadingRef.current?.focus();
    if (phase === "speak") speakHeadingRef.current?.focus();
  }, [phase]);

  const startPreparation = () => {
    setSeconds(60);
    setAnnouncement("一分鐘準備開始。只記關鍵詞和答案次序。");
    saveSessionDraft("prepare", notes);
    setPhase("prepare");
  };

  const startSpeaking = () => {
    setAnnouncement("現在開始回答。你的準備筆記仍保留在下方。");
    saveSessionDraft("speak", notes);
    setPhase("speak");
  };

  return (
    <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-7 lg:px-10">
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <Link href={returnHref} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-[#6d695f]"><ArrowLeft className="h-4 w-4" />{returnLabel}</Link>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="eyebrow text-[#ad3f29]">{lesson.englishTitle}</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">{lesson.prompt}</h1>
          <div className="mt-8 border-l border-[#ad3f29] pl-5"><p className="eyebrow text-[#665f55]">Answer framework</p><p className="mt-3 text-sm leading-7 text-[#6d695f]">{lesson.steps.join(" → ")}</p></div>
          {phase === "ready" ? <div className="mt-10"><Button onClick={startPreparation} className="h-[52px] w-full rounded-full bg-[#172019] px-7 text-white sm:w-auto"><Play className="mr-2 h-4 w-4" />開始 1 分鐘準備</Button></div> : null}
          {phase === "prepare" ? (
            <section className="mt-10" aria-labelledby="preparation-title">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-[#48634c]">Preparation</p>
                  <h2 ref={prepareHeadingRef} tabIndex={-1} id="preparation-title" className="mt-2 font-serif text-2xl outline-none">一分鐘準備</h2>
                  <p role="timer" aria-label={`準備時間剩餘 ${seconds} 秒`} className="mt-2 font-mono text-5xl">{formatDuration(seconds)}</p>
                </div>
                <Button variant="outline" onClick={startSpeaking} className="h-11 w-full rounded-full border-[#9f9687] sm:w-auto">準備好，開始回答</Button>
              </div>
              <div
                role="progressbar"
                aria-label="準備時間剩餘"
                aria-valuemin={0}
                aria-valuemax={60}
                aria-valuenow={seconds}
                className="mt-5 h-1 overflow-hidden bg-[#d7cebd]"
              >
                <div className="h-full bg-[#48634c] transition-[width] duration-300" style={{ width: `${(seconds / 60) * 100}%` }} />
              </div>
              <label htmlFor="preparation-notes" className="mt-6 block text-sm font-semibold text-[#26352a]">關鍵詞與答案次序</label>
              <p id="preparation-notes-help" className="mt-2 text-xs leading-5 text-[#665f55]">只記提示詞，不用寫完整稿；開始回答後筆記仍會保留。</p>
              <Textarea
                id="preparation-notes"
                aria-describedby="preparation-notes-help"
                value={notes}
                onChange={(event) => {
                  notesRef.current = event.target.value;
                  setNotes(event.target.value);
                  saveSessionDraft("prepare", event.target.value);
                }}
                className="mt-3 min-h-44 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7"
                placeholder="例如：position → reason → example → conclusion"
              />
            </section>
          ) : null}
          {phase === "speak" ? (
            <section className="mt-10" aria-labelledby="speaking-title">
              <div className="flex flex-col gap-4 border-b border-[#bdb3a2] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-[#ad3f29]">Your turn</p>
                  <h2 ref={speakHeadingRef} tabIndex={-1} id="speaking-title" className="mt-2 font-serif text-3xl outline-none">現在完整說一次</h2>
                </div>
                <Button variant="ghost" onClick={startPreparation} className="h-11 w-full rounded-full text-[#665f55] sm:w-auto"><RotateCcw className="mr-2 h-4 w-4" />重新準備 1 分鐘</Button>
              </div>
              {notes.trim() ? (
                <aside className="mt-5 border-l-2 border-[#48634c] bg-[#edf0e8] px-5 py-4" aria-label="你的準備筆記">
                  <p className="eyebrow text-[#48634c]">Your notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4f4b44]">{notes}</p>
                </aside>
              ) : null}
              <div className="mt-6"><PracticeCoach maxSeconds={60} mode="individual-response" task={lesson.prompt} paperId={paperId} onBeforeLogin={() => saveSessionDraft("speak", notes)} /></div>
            </section>
          ) : null}
        </section>
        <aside className="space-y-4">
          <div className="paper-surface paper-rule p-6"><Lightbulb className="h-5 w-5 text-[#ad3f29]" /><p className="mt-5 font-serif text-2xl">說完後自我檢查</p><ul className="mt-5 space-y-3 text-sm leading-6 text-[#6d695f]">{lesson.steps.slice(0, 4).map((step) => <li key={step}>— {step}</li>)}</ul></div>
          <div className="border border-[#bdb3a2] p-5"><p className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" />請保持自然語速</p><p className="mt-2 text-xs leading-5 text-[#665f55]">在一分鐘內清楚完成三個重點，比塞入更多但未解釋的內容更有效。</p></div>
        </aside>
      </div>
    </main>
  );
}
