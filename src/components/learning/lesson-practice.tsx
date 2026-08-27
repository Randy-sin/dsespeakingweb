"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { completeLesson } from "@/lib/learning/store";
import type { Lesson } from "@/lib/learning/types";

export function LessonPractice({ lesson }: { lesson: Lesson }) {
  const [answer, setAnswer] = useState("");
  const [completed, setCompleted] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<string[]>([]);
  const nextHref = lesson.mode === "group-discussion" ? "/practice/group-discussion" : `/practice/individual-response/session?type=${lesson.slug}`;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const targetSteps = lesson.steps.slice(0, 3);
  const enoughWords = wordCount >= 12;
  const enoughBehaviours = confirmedSteps.length >= 2;
  const readyToComplete = enoughWords && enoughBehaviours;

  const markComplete = () => {
    if (!readyToComplete) return;
    completeLesson(lesson.slug, lesson.duration);
    setCompleted(true);
  };

  const toggleStep = (step: string) => {
    setConfirmedSteps((current) => current.includes(step) ? current.filter((item) => item !== step) : [...current, step]);
  };

  return (
    <section className="border-t border-[#bdb3a2] pt-9">
      <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ad3f29] font-mono text-xs text-white">04</span><div><p className="eyebrow text-[#ad3f29]">Try it now</p><h2 className="mt-2 font-serif text-3xl">輪到你把方法說出來</h2></div></div>
      <div className="paper-surface mt-7 p-5 sm:p-7"><p className="eyebrow text-[#665f55]">Prompt</p><p className="mt-4 font-serif text-2xl leading-9">{lesson.prompt}</p></div>
      <label htmlFor="practice-note" className="mt-7 block text-sm font-semibold">先寫一段可以真正說出口的英文答案</label>
      <p id="practice-note-help" className="mt-2 text-xs leading-5 text-[#665f55]">至少 12 個英文詞；重點不是寫得長，而是把本課方法放進答案。</p>
      <Textarea id="practice-note" aria-describedby="practice-note-help practice-check-status" value={answer} onChange={(event) => { setAnswer(event.target.value); setCompleted(false); }} placeholder="Write the 2–4 sentences you would actually say…" className="mt-3 min-h-32 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7 focus-visible:ring-[#48634c]" />
      <fieldset className="mt-5 border border-[#c9c0b1] bg-white/35 p-4">
        <legend className="px-1 text-sm font-semibold text-[#26352a]">對照答案確認目標行為</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {targetSteps.map((step) => (
            <label key={step} className={`flex min-h-12 cursor-pointer items-start gap-3 border p-3 text-xs leading-5 ${confirmedSteps.includes(step) ? "border-[#48634c] bg-[#edf0e8]" : "border-[#d7cebd] bg-[#faf7ef]"}`}>
              <input type="checkbox" checked={confirmedSteps.includes(step)} onChange={() => toggleStep(step)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#48634c]" />
              <span>{step}</span>
            </label>
          ))}
        </div>
        <p id="practice-check-status" aria-live="polite" className="mt-3 text-xs leading-5 text-[#665f55]">
          {enoughWords ? `字數足夠（${wordCount} words）` : `還差 ${12 - wordCount} 個英文詞`} · {enoughBehaviours ? "已確認至少兩項目標行為" : "請在答案中找到並確認至少兩項目標行為"}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-[#6d695f]">這是結構自檢，不是 AI 或 HKEAA 評分；不符合時答案會保留，請直接修改。</p>
      </fieldset>
      {!completed ? (
        <Button type="button" onClick={markComplete} className="mt-5 h-12 w-full rounded-full bg-[#172019] px-6 text-white sm:w-auto" disabled={!readyToComplete}>完成短練習<Check className="ml-2 h-4 w-4" /></Button>
      ) : (
        <div className="mt-5 border border-[#92a194] bg-[#e2e9e2] p-5"><div className="flex gap-3"><Check className="h-5 w-5 text-[#48634c]" /><div><p className="font-semibold">這一課已完成</p><p className="mt-1 text-sm leading-6 text-[#5e5b53]">你已在答案中確認至少兩項目標行為。下一步是離開筆記，直接用聲音完成同一題。</p></div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button asChild className="rounded-full bg-[#48634c] text-white"><Link href={nextHref}>進入計時練習<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="ghost" onClick={() => { setAnswer(""); setConfirmedSteps([]); setCompleted(false); }} className="rounded-full"><RotateCcw className="mr-2 h-4 w-4" />再寫一次</Button></div></div>
      )}
    </section>
  );
}
