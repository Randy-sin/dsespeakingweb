"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CircleDot,
  MessageCircleMore,
  Mic2,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { allLessons, getLesson, getNextLesson } from "@/lib/learning/content";
import { buildLearningPlan, useLearnerProfile, useLearningProgress } from "@/lib/learning/store";

const starterSteps = [
  { label: "找出弱項", detail: "用兩分鐘回答目標、信心與卡住的位置。" },
  { label: "完成一節短課", detail: "先比較弱例與強例，再記住可重用的答案骨架。" },
  { label: "離開筆記開口", detail: "用同類題目錄一次，校對逐字稿後再看回饋。" },
];

export function LearningDashboard() {
  const profile = useLearnerProfile();
  const progress = useLearningProgress();

  if (!profile?.completedOnboarding) {
    return (
      <main id="main-content">
        <section className="mx-auto grid min-h-[680px] max-w-[1440px] items-center gap-12 px-4 py-16 sm:px-7 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-7">
            <p className="eyebrow text-[#ad3f29]">Your learning path</p>
            <h1 className="display-title mt-5 max-w-4xl text-6xl leading-[0.88] sm:text-8xl">先找出最值得改善的一步。</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#6d695f]">
              完成兩分鐘診斷，我們會按照你的信心、弱項和每週時間安排第一課。你也可以先看課程，不必建立帳戶。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-full bg-[#ad3f29] px-6 text-white hover:bg-[#aa3d27]">
                <Link href="/onboarding">開始能力診斷<ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-[#9f9687] bg-transparent px-6">
                <Link href="/learn/group-discussion">先看全部課程</Link>
              </Button>
            </div>
          </div>

          <aside className="paper-surface paper-rule p-7 sm:p-9 lg:col-span-5">
            <p className="eyebrow text-[#48634c]">Your first 20 minutes</p>
            <div className="learning-rail mt-7 space-y-7">
              {starterSteps.map((step, index) => (
                <div key={step.label} className="relative grid grid-cols-[48px_1fr] gap-4">
                  <span className="z-10 grid h-12 w-12 place-items-center rounded-full border border-[#8da08f] bg-[#faf7ef] font-mono text-[11px] text-[#48634c]">
                    0{index + 1}
                  </span>
                  <div className="pt-1">
                    <p className="font-serif text-xl">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6d695f]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-y border-[#c9bfad] bg-[#e8e0cf]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <StarterPath
              eyebrow="Track A · Interaction"
              title="小組討論"
              detail="從接話開始，練到展開、反駁、澄清、轉題和總結。"
              href="/learn/group-discussion"
              icon={MessageCircleMore}
            />
            <StarterPath
              eyebrow="Track B · Structure"
              title="個人回應"
              detail="用五類常見題型，建立一分鐘答案的穩定骨架。"
              href="/learn/individual-response"
              icon={Mic2}
            />
          </div>
        </section>
      </main>
    );
  }

  const plan = buildLearningPlan(profile);
  const recommendedLesson = getLesson(plan.mode, plan.lessonSlug);
  const modeNextLesson = getNextLesson(progress.completedLessons, plan.mode);
  const nextLesson = recommendedLesson && !progress.completedLessons.includes(recommendedLesson.slug)
    ? recommendedLesson
    : modeNextLesson ?? getNextLesson(progress.completedLessons);
  const percentage = Math.round((progress.completedLessons.length / allLessons.length) * 100);
  const lastActive = progress.lastActiveAt
    ? new Intl.DateTimeFormat("zh-HK", { month: "short", day: "numeric" }).format(new Date(progress.lastActiveAt))
    : "尚未開始";
  const todayTasks = nextLesson
    ? nextLesson.slug === plan.lessonSlug
      ? plan.weeklyTasks
      : [
          `完成 ${nextLesson.duration} 分鐘短課`,
          ...nextLesson.steps.slice(0, 2),
        ]
    : ["完成一次 60 秒個人回應", "完成一次小組討論接話", "選一項回饋再重練"];

  return (
    <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-12 sm:px-7 lg:px-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-2">
          <p className="eyebrow text-[#665f55]">{profile.examYear} Candidate</p>
          <div className="mt-5 h-1 bg-[#d7cebd]" aria-label={`已完成 ${percentage}%`}>
            <div className="h-full bg-[#ad3f29]" style={{ width: `${percentage}%` }} />
          </div>
          <p className="mt-3 font-mono text-xs text-[#6d695f]">{progress.completedLessons.length} / {allLessons.length} LESSONS</p>
          <div className="mt-9 border-l border-[#bdb3a2] pl-4">
            <p className="eyebrow text-[#665f55]">Last active</p>
            <p className="mt-2 text-sm font-semibold">{lastActive}</p>
          </div>
        </aside>

        <section className="lg:col-span-7">
          <p className="eyebrow text-[#ad3f29]">Today&apos;s one task</p>
          <h1 className="display-title mt-4 text-5xl leading-[0.95] sm:text-7xl">
            {nextLesson ? nextLesson.title : "把方法帶入一次完整練習。"}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#6d695f]">
            {nextLesson
              ? nextLesson.slug === plan.lessonSlug
                ? plan.reason
                : `你已完成推薦起點。下一步用 ${nextLesson.duration} 分鐘建立「${nextLesson.skill}」能力。`
              : "兩條學習路徑已完成。現在用真題和計時錄音，把技巧變成穩定表現。"}
          </p>

          <article className="paper-surface paper-rule mt-10 p-6 sm:p-9">
            <div className="flex items-center justify-between border-b border-[#bdb3a2] pb-5">
              <span className="eyebrow text-[#48634c]">{nextLesson ? `${nextLesson.duration} minute lesson` : "Practice set"}</span>
              <BookOpenText className="h-5 w-5" />
            </div>
            <h2 className="mt-7 font-serif text-3xl">
              {nextLesson?.englishTitle ?? "Choose one timed response"}
            </h2>
            <ul className="mt-6 space-y-3">
              {todayTasks.map((task) => (
                <li key={task} className="flex gap-3 text-sm">
                  <CircleDot className="h-4 w-4 shrink-0 text-[#48634c]" />
                  {task}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 h-12 rounded-full bg-[#172019] px-6 text-white">
              <Link href={nextLesson ? `/learn/${nextLesson.mode}/${nextLesson.slug}` : "/practice/individual-response"}>
                {nextLesson ? "開始今日一課" : "開始計時練習"}<ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        </section>

        <aside className="space-y-4 lg:col-span-3">
          <DashboardStat icon={CalendarDays} label="每週目標" value={`${profile.weeklyMinutes} 分鐘`} />
          <DashboardStat icon={Route} label="已完成" value={`${progress.completedLessons.length} 課`} />
          <DashboardStat icon={Mic2} label="開口練習" value={`${progress.practiceCount} 次`} />
          <Link href="/progress" className="flex items-center justify-between border-t border-[#bdb3a2] pt-5 text-sm font-semibold">
            查看完整進度<ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </main>
  );
}

function StarterPath({ eyebrow, title, detail, href, icon: Icon }: { eyebrow: string; title: string; detail: string; href: string; icon: typeof Mic2 }) {
  return (
    <Link href={href} className="group relative min-h-80 border-b border-[#c9bfad] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
      <div className="flex items-start justify-between">
        <p className="eyebrow text-[#48634c]">{eyebrow}</p>
        <Icon className="h-6 w-6 stroke-[1.4]" />
      </div>
      <h2 className="display-title mt-16 text-5xl">{title}</h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-[#5e5b53]">{detail}</p>
      <span className="mt-8 flex items-center justify-between border-t border-[#bdb3a2] pt-5 text-sm font-semibold">
        查看課程地圖<ArrowDownRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
      </span>
    </Link>
  );
}

function DashboardStat({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="border border-[#bdb3a2] bg-[#faf7ef] p-5">
      <Icon className="h-5 w-5 text-[#48634c]" />
      <p className="eyebrow mt-6 text-[#665f55]">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
}
