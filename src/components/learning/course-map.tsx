"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3 } from "lucide-react";
import { useLearningProgress } from "@/lib/learning/store";
import type { Lesson, PracticeMode } from "@/lib/learning/types";

export function CourseMap({ mode, lessons }: { mode: PracticeMode; lessons: Lesson[] }) {
  const progress = useLearningProgress();
  const base = `/learn/${mode}`;
  const nextIndex = lessons.findIndex((lesson) => !progress.completedLessons.includes(lesson.slug));
  const completedCount = lessons.filter((lesson) => progress.completedLessons.includes(lesson.slug)).length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 border-y border-[#bdb3a2] py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5e5b53]">
          <span className="font-semibold text-[#172019]">{completedCount} / {lessons.length}</span> 課完成
        </p>
        <p className="text-xs leading-5 text-[#665f55]">所有課程都可以瀏覽；「下一課」只代表建議次序。</p>
      </div>

      <div className="relative">
        <div className="absolute bottom-8 left-[23px] top-8 w-px bg-[#bdb3a2]" />
        <div className="space-y-5">
          {lessons.map((lesson, index) => {
            const done = progress.completedLessons.includes(lesson.slug);
            const recommended = !done && index === nextIndex;

            return (
              <article key={lesson.slug} className="relative pl-[72px]">
                <span
                  className={`absolute left-0 top-5 z-10 grid h-12 w-12 place-items-center rounded-full border font-mono text-xs ${
                    done
                      ? "border-[#48634c] bg-[#48634c] text-white"
                      : recommended
                        ? "border-[#ad3f29] bg-[#ad3f29] text-white"
                        : "border-[#a79d8c] bg-[#f3efe4]"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : lesson.number}
                </span>

                <Link
                  href={`${base}/${lesson.slug}`}
                  className={`group grid gap-5 border p-5 transition-colors sm:grid-cols-[1fr_auto] sm:items-center sm:p-6 ${
                    recommended
                      ? "border-[#ad3f29] bg-[#faf7ef]"
                      : "border-[#bdb3a2] bg-[#faf7ef] hover:border-[#48634c] hover:bg-white"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="eyebrow text-[#ad3f29]">{lesson.skill}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#665f55]"><Clock3 className="h-3 w-3" />{lesson.duration} MIN</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#48634c]">
                        {done ? "已完成" : recommended ? "建議下一課" : "可瀏覽"}
                      </span>
                    </div>
                    <h2 className="mt-3 pr-10 font-serif text-2xl tracking-[-0.03em] sm:pr-0 sm:text-3xl">{lesson.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d695f]">{lesson.summary}</p>
                  </div>
                  <span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-[#9f9687] bg-[#f3efe4] transition-colors group-hover:bg-[#172019] group-hover:text-white sm:static">
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">開始{lesson.title}</span>
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
