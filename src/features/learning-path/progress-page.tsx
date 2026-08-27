"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, LoaderCircle, Mic2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allLessons, gdLessons, getNextLesson, irLessons } from "@/lib/learning/content";
import { useLearnerProfile, useLearningProgress } from "@/lib/learning/store";
import { useUser } from "@/hooks/use-user";

type RecentPractice = {
  id: string;
  mode: "group-discussion" | "individual-response";
  task_text: string;
  status: string;
  duration_seconds: number | null;
  feedback: unknown;
  created_at: string;
  paper: { paper_id: string } | null;
};

function assessmentFromFeedback(feedback: unknown) {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) return null;
  const assessment = (feedback as Record<string, unknown>).assessment;
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) return null;
  const value = assessment as { summary?: unknown; trainingLevel?: unknown; rubrics?: unknown };
  return {
    summary: typeof value.summary === "string" ? value.summary : null,
    trainingLevel: typeof value.trainingLevel === "number" ? value.trainingLevel : null,
    rubrics: Array.isArray(value.rubrics) ? value.rubrics.filter((item): item is { criterion: string; nextStep: string } => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const rubric = item as Record<string, unknown>;
      return typeof rubric.criterion === "string" && typeof rubric.nextStep === "string";
    }) : [],
  };
}

export function ProgressPage() {
  const profile = useLearnerProfile();
  const progress = useLearningProgress();
  const { user, loading: userLoading, supabase } = useUser();
  const [recentPractices, setRecentPractices] = useState<RecentPractice[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const percent = Math.round((progress.completedLessons.length / allLessons.length) * 100);
  const completedGd = gdLessons.filter((lesson) => progress.completedLessons.includes(lesson.slug)).length;
  const completedIr = irLessons.filter((lesson) => progress.completedLessons.includes(lesson.slug)).length;
  const nextLesson = getNextLesson(progress.completedLessons);
  const lastActive = progress.lastActiveAt
    ? new Intl.DateTimeFormat("zh-HK", { year: "numeric", month: "short", day: "numeric" }).format(new Date(progress.lastActiveAt))
    : "完成第一節課後開始記錄";

  useEffect(() => {
    let active = true;
    window.queueMicrotask(() => {
      if (!active) return;
      if (!user) {
        setRecentPractices([]);
        setHistoryLoading(false);
        setHistoryError("");
      } else {
        setHistoryLoading(true);
      }
    });
    if (!user) return () => { active = false; };

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("id,mode,task_text,status,duration_seconds,feedback,created_at,paper:pastpaper_papers(paper_id)")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!active) return;
      if (error) {
        setHistoryError("暫時未能載入雲端練習記錄，本機課程進度不受影響。");
      } else {
        setRecentPractices((data ?? []) as unknown as RecentPractice[]);
        setHistoryError("");
      }
      setHistoryLoading(false);
    };

    void loadHistory();
    return () => { active = false; };
  }, [supabase, user]);

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

      <section className="mt-16 border-t border-[#172019] pt-7" aria-labelledby="recent-practice-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#48634c]">Recent evidence</p>
            <h2 id="recent-practice-title" className="mt-2 font-serif text-3xl">最近三次開口練習</h2>
          </div>
          {!userLoading && !user ? <Button asChild variant="outline" className="rounded-full border-[#9f9687]"><Link href="/login?next=%2Fprogress">登入查看雲端記錄</Link></Button> : null}
        </div>
        {historyLoading ? <p role="status" className="mt-6 inline-flex items-center gap-2 text-sm text-[#665f55]"><LoaderCircle className="h-4 w-4 animate-spin" />正在載入練習證據……</p> : null}
        {historyError ? <p role="alert" className="mt-6 border-l-2 border-[#ad3f29] pl-4 text-sm text-[#a74231]">{historyError}</p> : null}
        {user && !historyLoading && !historyError && recentPractices.length === 0 ? <p className="mt-6 text-sm leading-7 text-[#665f55]">完成一次錄音或 AI 逐字稿分析後，這裡會顯示題目、訓練訊號和下一步。</p> : null}
        {recentPractices.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {recentPractices.map((practice) => {
              const assessment = assessmentFromFeedback(practice.feedback);
              const retryHref = practice.paper?.paper_id
                ? `/papers/${practice.paper.paper_id}`
                : practice.mode === "group-discussion" ? "/practice/group-discussion" : "/practice/individual-response";
              return (
                <article key={practice.id} className="flex flex-col border border-[#bdb3a2] bg-[#faf7ef] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-[#ad3f29]">{practice.mode === "group-discussion" ? "GROUP" : "INDIVIDUAL"}</span>
                    <span className="font-mono text-xs text-[#665f55]">{new Intl.DateTimeFormat("zh-HK", { month: "short", day: "numeric" }).format(new Date(practice.created_at))}</span>
                  </div>
                  <h3 className="mt-5 line-clamp-3 font-serif text-xl leading-7">{practice.task_text}</h3>
                  {assessment?.summary ? <p className="mt-4 text-sm leading-6 text-[#5e5b53]">{assessment.summary}</p> : <p className="mt-4 text-sm text-[#665f55]">狀態：{practice.status === "recorded" ? "已錄音" : practice.status === "transcribed" ? "已生成逐字稿" : "已保存"}</p>}
                  {assessment?.trainingLevel ? <p className="mt-3 font-mono text-sm text-[#ad3f29]">TRAINING SIGNAL {assessment.trainingLevel}/5</p> : null}
                  {assessment && assessment.rubrics.length > 0 ? <details className="mt-4 border-t border-[#d7cebd] pt-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">查看上次的下一步</summary><ul className="mt-2 space-y-2 text-xs leading-5 text-[#5e5b53]">{assessment.rubrics.map((rubric) => <li key={rubric.criterion}><strong>{rubric.criterion}：</strong>{rubric.nextStep}</li>)}</ul></details> : null}
                  <Link href={retryHref} className="mt-auto inline-flex min-h-11 items-center border-t border-[#bdb3a2] pt-4 text-sm font-semibold">返回題目並重練<ArrowRight className="ml-auto h-4 w-4" /></Link>
                </article>
              );
            })}
          </div>
        ) : null}
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
