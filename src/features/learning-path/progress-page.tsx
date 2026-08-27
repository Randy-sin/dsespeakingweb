"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, Mic2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allLessons, gdLessons, getNextLesson, irLessons } from "@/lib/learning/content";
import { useLearnerProfile, useLearningProgress } from "@/lib/learning/store";

export function ProgressPage() {
  const profile = useLearnerProfile();
  const progress = useLearningProgress();
  const percent = Math.round((progress.completedLessons.length / allLessons.length) * 100);
  const completedGd = gdLessons.filter((lesson) => progress.completedLessons.includes(lesson.slug)).length;
  const completedIr = irLessons.filter((lesson) => progress.completedLessons.includes(lesson.slug)).length;
  const nextLesson = getNextLesson(progress.completedLessons);
  const lastActive = progress.lastActiveAt
    ? new Intl.DateTimeFormat("zh-HK", { year: "numeric", month: "short", day: "numeric" }).format(new Date(progress.lastActiveAt))
    : "完成第一節課後開始記錄";

  return (
    <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-7 lg:px-10 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-[#ad3f29]">Learning progress</p>
          <h1 className="display-title mt-5 text-6xl leading-[0.88] sm:text-8xl">進步要看得見，下一步也要清楚。</h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#6d695f]">
            這裡記錄已完成的技巧課和開口練習。登入前資料保存在這部裝置；登入後才會同步至你的帳戶。
          </p>
        </div>

        <aside className="paper-surface p-7 lg:col-span-4 lg:col-start-9">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-[#48634c]">Overall</p>
            <Target className="h-5 w-5 text-[#48634c]" />
          </div>
          <p className="mt-5 font-mono text-6xl tracking-[-0.08em]">{percent}%</p>
          <div className="mt-6 h-1.5 bg-[#d7cebd]" aria-label={`總進度 ${percent}%`}>
            <div className="h-full bg-[#ad3f29]" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-4 text-sm text-[#6d695f]">{progress.completedLessons.length} / {allLessons.length} 個短課完成</p>
        </aside>
      </div>

      <section className="mt-16 grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] md:grid-cols-3">
        <ProgressStat icon={BookOpenText} label="小組討論" value={`${completedGd} / ${gdLessons.length}`} />
        <ProgressStat icon={Mic2} label="個人回應" value={`${completedIr} / ${irLessons.length}`} />
        <ProgressStat icon={Clock3} label="累積學習" value={`${progress.practiceMinutes} 分鐘`} />
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-12">
        <article className="border-t border-[#172019] pt-6 lg:col-span-8">
          <p className="eyebrow text-[#ad3f29]">Recommended next</p>
          {nextLesson ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="font-serif text-lg italic text-[#665f55]">{nextLesson.englishTitle}</p>
                <h2 className="display-title mt-1 text-4xl sm:text-5xl">{nextLesson.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6d695f]">{nextLesson.summary}</p>
              </div>
              <Button asChild className="h-12 rounded-full bg-[#172019] px-6 text-white">
                <Link href={`/learn/${nextLesson.mode}/${nextLesson.slug}`}>繼續下一課<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="mt-5 flex gap-4 border border-[#8da08f] bg-[#e5ebe4] p-6">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[#48634c]" />
              <div>
                <h2 className="font-serif text-3xl">兩條技巧路徑都完成了。</h2>
                <p className="mt-2 text-sm leading-7 text-[#5e5b53]">下一階段用真題交替練習 GD 和 IR，每次只選一項回饋重練。</p>
              </div>
            </div>
          )}
        </article>

        <aside className="border-l border-[#ad3f29] pl-5 lg:col-span-3 lg:col-start-10">
          <p className="eyebrow text-[#ad3f29]">Learning record</p>
          <p className="mt-5 text-sm text-[#6d695f]">最近活動</p>
          <p className="mt-1 font-serif text-2xl">{lastActive}</p>
          <p className="mt-5 text-sm text-[#6d695f]">每週目標</p>
          <p className="mt-1 font-serif text-2xl">{profile ? `${profile.weeklyMinutes} 分鐘` : "尚未設定"}</p>
          {!profile ? (
            <Link href="/onboarding" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline decoration-[#ad3f29] underline-offset-4">
              完成能力診斷<ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </aside>
      </section>

      <section className="mt-16 grid gap-8 border-t border-[#bdb3a2] lg:grid-cols-2">
        <PathCard title="繼續小組討論" detail="練習接話、展開、反駁與協作。" href="/learn/group-discussion" />
        <PathCard title="繼續個人回應" detail="掌握五類常見題型的答案骨架。" href="/learn/individual-response" />
      </section>
    </main>
  );
}

function ProgressStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <article className="bg-[#faf7ef] p-7">
      <Icon className="h-5 w-5 text-[#48634c]" />
      <p className="eyebrow mt-8 text-[#665f55]">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </article>
  );
}

function PathCard({ title, detail, href }: { title: string; detail: string; href: string }) {
  return (
    <Link href={href} className="group flex items-end justify-between py-6">
      <div>
        <h2 className="font-serif text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-[#6d695f]">{detail}</p>
      </div>
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
