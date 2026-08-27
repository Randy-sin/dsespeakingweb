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
  const nextHref = lesson.mode === "group-discussion" ? "/practice/group-discussion" : `/practice/individual-response?type=${lesson.slug}`;

  const markComplete = () => {
    completeLesson(lesson.slug, lesson.duration);
    setCompleted(true);
  };

  return (
    <section className="border-t border-[#bdb3a2] pt-9">
      <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ad3f29] font-mono text-xs text-white">04</span><div><p className="eyebrow text-[#ad3f29]">Try it now</p><h2 className="mt-2 font-serif text-3xl">輪到你把方法說出來</h2></div></div>
      <div className="paper-surface mt-7 p-5 sm:p-7"><p className="eyebrow text-[#665f55]">Prompt</p><p className="mt-4 font-serif text-2xl leading-9">{lesson.prompt}</p></div>
      <label htmlFor="practice-note" className="mt-7 block text-sm font-semibold">先寫下三個關鍵詞或你的答案骨架</label>
      <Textarea id="practice-note" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="只寫關鍵詞，不需要準備完整稿……" className="mt-3 min-h-32 border-[#bdb3a2] bg-[#faf7ef] text-base leading-7 focus-visible:ring-[#48634c]" />
      {!completed ? (
        <Button type="button" onClick={markComplete} className="mt-5 h-12 rounded-full bg-[#172019] px-6 text-white" disabled={answer.trim().length < 3}>完成短練習<Check className="ml-2 h-4 w-4" /></Button>
      ) : (
        <div className="mt-5 border border-[#92a194] bg-[#e2e9e2] p-5"><div className="flex gap-3"><Check className="h-5 w-5 text-[#48634c]" /><div><p className="font-semibold">這一課已完成</p><p className="mt-1 text-sm leading-6 text-[#5e5b53]">下一步是離開筆記，直接用聲音完成同一題。</p></div></div><div className="mt-5 flex flex-wrap gap-3"><Button asChild className="rounded-full bg-[#48634c] text-white"><Link href={nextHref}>進入計時練習<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="ghost" onClick={() => { setAnswer(""); setCompleted(false); }} className="rounded-full"><RotateCcw className="mr-2 h-4 w-4" />再寫一次</Button></div></div>
      )}
    </section>
  );
}
