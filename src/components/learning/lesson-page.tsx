import Link from "next/link";
import { ArrowLeft, Check, Clock3, X } from "lucide-react";
import { LessonPractice } from "@/components/learning/lesson-practice";
import type { Lesson } from "@/lib/learning/types";

export function LessonPage({ lesson }: { lesson: Lesson }) {
  const courseHref = `/learn/${lesson.mode}`;
  return (
    <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-10 sm:px-7 lg:px-10 lg:py-16">
      <Link href={courseHref} className="inline-flex items-center gap-2 text-sm text-[#6d695f] hover:text-[#172019]"><ArrowLeft className="h-4 w-4" />返回課程地圖</Link>
      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-2"><p className="eyebrow text-[#c84b31]">Lesson {lesson.number}</p><div className="mt-5 h-px bg-[#bdb3a2]" /><p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-[#8a8175]"><Clock3 className="h-3.5 w-3.5" />{lesson.duration} MINUTES</p><p className="mt-3 font-mono text-[11px] text-[#8a8175]">SKILL · {lesson.skill.toUpperCase()}</p></aside>
        <article className="lg:col-span-7">
          <p className="font-serif text-lg italic text-[#8a8175]">{lesson.englishTitle}</p>
          <h1 className="display-title mt-2 text-5xl leading-[0.95] sm:text-7xl">{lesson.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5e5b53]">{lesson.summary}</p>

          <section className="mt-14 border-t border-[#bdb3a2] pt-9">
            <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#48634c] font-mono text-xs text-white">01</span><div><p className="eyebrow text-[#48634c]">Core principle</p><h2 className="mt-2 font-serif text-3xl">先記住一條原則</h2></div></div>
            <blockquote className="paper-surface margin-note mt-7 p-6 font-serif text-2xl leading-10 sm:p-8 sm:text-3xl">{lesson.principle}</blockquote>
          </section>

          <section className="mt-14 border-t border-[#bdb3a2] pt-9">
            <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#48634c] font-mono text-xs text-white">02</span><div><p className="eyebrow text-[#48634c]">Answer framework</p><h2 className="mt-2 font-serif text-3xl">按這個次序完成</h2></div></div>
            <ol className="mt-7 grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] sm:grid-cols-2">{lesson.steps.map((step, index) => <li key={step} className="flex min-h-28 gap-4 bg-[#faf7ef] p-5"><span className="font-mono text-xs text-[#c84b31]">0{index + 1}</span><p className="font-serif text-xl leading-7">{step}</p></li>)}</ol>
          </section>

          <section className="mt-14 border-t border-[#bdb3a2] pt-9">
            <div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#48634c] font-mono text-xs text-white">03</span><div><p className="eyebrow text-[#48634c]">Compare examples</p><h2 className="mt-2 font-serif text-3xl">看清楚差別在哪裡</h2></div></div>
            <div className="mt-7 grid gap-5">{lesson.examples.map((example) => <article key={example.label} className={`border p-5 sm:p-7 ${example.tone === "strong" ? "border-[#7d927f] bg-[#e5ebe4]" : "border-[#d6a99d] bg-[#f1e2dc]"}`}><div className="flex items-center gap-3">{example.tone === "strong" ? <Check className="h-4 w-4 text-[#48634c]" /> : <X className="h-4 w-4 text-[#a74231]" />}<p className="eyebrow">{example.label}</p></div><p className="mt-5 font-serif text-xl leading-8 sm:text-2xl">“{example.text}”</p><p className="mt-5 border-t border-current/20 pt-4 text-sm leading-6 text-[#5e5b53]">{example.note}</p></article>)}</div>
          </section>

          <div className="mt-14"><LessonPractice lesson={lesson} /></div>
        </article>
        <aside className="lg:col-span-3"><div className="sticky top-24 border-l border-[#c84b31] pl-5"><p className="eyebrow text-[#c84b31]">Teacher&apos;s margin</p><p className="mt-4 text-sm leading-7 text-[#6d695f]">先把結構練穩，再改善句式。第一次練習只需要清楚完成每一步，不需要追求艱深詞彙。</p></div></aside>
      </div>
    </main>
  );
}
