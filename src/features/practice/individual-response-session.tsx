"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PracticeCoach } from "@/features/practice/practice-coach";
import type { Lesson } from "@/lib/learning/types";

export function IndividualResponseSession({ lesson }: { lesson: Lesson }) {
  const [phase, setPhase] = useState<"ready" | "prepare" | "speak">("ready");
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (phase !== "prepare") return;
    const interval = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          window.queueMicrotask(() => setPhase("speak"));
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  return (
    <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-7 lg:px-10">
      <Link href="/practice/individual-response" className="inline-flex items-center gap-2 text-sm text-[#6d695f]"><ArrowLeft className="h-4 w-4" />重新選擇題型</Link>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="eyebrow text-[#ad3f29]">{lesson.englishTitle}</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">{lesson.prompt}</h1>
          <div className="mt-8 border-l border-[#ad3f29] pl-5"><p className="eyebrow text-[#665f55]">Answer framework</p><p className="mt-3 text-sm leading-7 text-[#6d695f]">{lesson.steps.join(" → ")}</p></div>
          {phase === "ready" ? <div className="mt-10"><Button onClick={() => setPhase("prepare")} className="h-[52px] rounded-full bg-[#172019] px-7 text-white"><Play className="mr-2 h-4 w-4" />開始 1 分鐘準備</Button></div> : null}
          {phase === "prepare" ? <div className="mt-10"><div className="flex items-end justify-between"><div><p className="eyebrow text-[#48634c]">Preparation</p><p className="mt-2 font-mono text-5xl">00:{String(seconds).padStart(2, "0")}</p></div><Button variant="outline" onClick={() => setPhase("speak")} className="rounded-full border-[#9f9687]">準備好，開始回答</Button></div><Textarea className="mt-6 min-h-44 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7" placeholder="只記錄關鍵詞和答案次序，不要寫完整稿……" /></div> : null}
          {phase === "speak" ? <div className="mt-10"><PracticeCoach maxSeconds={60} mode="individual-response" task={lesson.prompt} /></div> : null}
        </section>
        <aside className="space-y-4">
          <div className="paper-surface paper-rule p-6"><Lightbulb className="h-5 w-5 text-[#ad3f29]" /><p className="mt-5 font-serif text-2xl">說完後自我檢查</p><ul className="mt-5 space-y-3 text-sm leading-6 text-[#6d695f]">{lesson.steps.slice(0, 4).map((step) => <li key={step}>— {step}</li>)}</ul></div>
          <div className="border border-[#bdb3a2] p-5"><p className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" />請保持自然語速</p><p className="mt-2 text-xs leading-5 text-[#665f55]">在一分鐘內清楚完成三個重點，比塞入更多但未解釋的內容更有效。</p></div>
        </aside>
      </div>
    </main>
  );
}
