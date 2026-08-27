import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseMap } from "@/components/learning/course-map";
import type { Lesson, PracticeMode } from "@/lib/learning/types";

export function CoursePage({ mode, lessons }: { mode: PracticeMode; lessons: Lesson[] }) {
  const isGd = mode === "group-discussion";
  return (
    <main id="main-content">
      <section className={`border-b border-[#bdb3a2] ${isGd ? "bg-[#48634c] text-[#faf7ef]" : "bg-[#ad3f29] text-white"}`}>
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-7 lg:grid-cols-12 lg:px-10 lg:py-24">
          <div className="lg:col-span-8">
            <p className="eyebrow opacity-70">{isGd ? "Track A · Interaction" : "Track B · Structure"}</p>
            <h1 className="display-title mt-5 text-[clamp(4rem,9vw,8rem)] leading-[0.8]">{isGd ? <>Group<br /><span className="italic">Discussion</span></> : <>Individual<br /><span className="italic">Response</span></>}</h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4"><p className="max-w-md text-base leading-8 opacity-80">{isGd ? "六個短課，學會如何建立真正互動：從開始討論，到回應、澄清、反駁、轉題和總結。" : "五種常見題型，每一課都用清晰答案骨架、弱例與強例，建立一分鐘回應能力。"}</p><Link href={isGd ? "/practice/group-discussion" : "/practice/individual-response"} className="mt-7 flex items-center justify-between border-t border-white/40 pt-5 text-sm font-semibold">直接進入練習<ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-7 lg:grid-cols-12 lg:px-10 lg:py-24">
        <aside className="lg:col-span-3"><p className="eyebrow text-[#665f55]">Course map</p><h2 className="display-title mt-4 text-4xl">依次建立能力，而不是背一堆萬用句。</h2></aside>
        <div className="lg:col-span-9"><CourseMap mode={mode} lessons={lessons} /></div>
      </section>
    </main>
  );
}
