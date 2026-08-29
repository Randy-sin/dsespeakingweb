import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Clock3,
  Mic2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "學習行為分析",
  robots: { index: false, follow: false, noarchive: true },
};

type Summary = {
  events: number;
  sessions: number;
  engagedSessions: number;
  recordingSessions: number;
  valueSessions: number;
  errorSessions: number;
};

type DailyRow = {
  date: string;
  events: number;
  sessions: number;
  valueSessions: number;
  failures: number;
};

type FunnelRow = { step: string; sessions: number };
type FeatureRow = {
  event: string;
  surface: string | null;
  mode: string | null;
  outcome: string | null;
  events: number;
  sessions: number;
};
type FailureRow = { code: string; surface: string | null; events: number; sessions: number };
type Historical = {
  practiceSessions: number;
  completedPracticeSessions: number;
  practiceTurns: number;
  completedLessons: number;
  onboardedLearners: number;
};

type Analytics = {
  periodDays: number;
  collectionStartedAt: string | null;
  summary: Summary;
  daily: DailyRow[];
  funnel: FunnelRow[];
  features: FeatureRow[];
  failures: FailureRow[];
  historical: Historical;
};

const eventLabels: Record<string, string> = {
  site_session_started: "開始網站工作階段",
  primary_cta_clicked: "點擊主要開始按鈕",
  paper_opened: "打開真題",
  practice_started: "進入練習",
  preparation_started: "開始準備",
  recording_started: "開始錄音",
  recording_completed: "完成錄音",
  recording_failed: "錄音失敗",
  text_fallback_opened: "開啟文字後備",
  transcription_completed: "取得逐字稿",
  transcription_failed: "逐字稿失敗",
  analysis_completed: "取得 AI 評析",
  analysis_failed: "AI 評析失敗",
  basic_coaching_delivered: "收到基本教練提示",
  discussion_turn_completed: "完成討論回合",
  discussion_completed: "討論流程結束",
  auth_started: "開始登入",
  auth_completed: "完成登入",
  auth_failed: "登入失敗",
  onboarding_completed: "首次體驗結束",
  lesson_completed: "完成技巧課",
  flow_error: "流程錯誤",
  ai_value_received: "收到逐字稿或 AI 回饋",
};

const surfaceLabels: Record<string, string> = {
  home: "首頁",
  onboarding: "首次體驗",
  papers: "真題庫",
  learn: "技巧課",
  practice: "練習",
  auth: "登入",
};

const outcomeLabels: Record<string, string> = {
  success: "成功",
  failure: "失敗",
  cancelled: "提早結束",
  blocked: "受阻",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function rows<T>(value: unknown, parser: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map(parser);
}

function parseAnalytics(value: unknown, fallbackDays: number): Analytics {
  if (
    !isRecord(value) ||
    !isRecord(value.summary) ||
    !isRecord(value.historical) ||
    !Array.isArray(value.daily) ||
    !Array.isArray(value.funnel) ||
    !Array.isArray(value.features) ||
    !Array.isArray(value.failures)
  ) {
    throw new Error("Invalid product analytics response");
  }
  const summary = isRecord(value.summary) ? value.summary : {};
  const historical = isRecord(value.historical) ? value.historical : {};

  return {
    periodDays: numberValue(value.periodDays) || fallbackDays,
    collectionStartedAt: nullableString(value.collectionStartedAt),
    summary: {
      events: numberValue(summary.events),
      sessions: numberValue(summary.sessions),
      engagedSessions: numberValue(summary.engagedSessions),
      recordingSessions: numberValue(summary.recordingSessions),
      valueSessions: numberValue(summary.valueSessions),
      errorSessions: numberValue(summary.errorSessions),
    },
    daily: rows(value.daily, (row) => ({
      date: stringValue(row.date),
      events: numberValue(row.events),
      sessions: numberValue(row.sessions),
      valueSessions: numberValue(row.valueSessions),
      failures: numberValue(row.failures),
    })),
    funnel: rows(value.funnel, (row) => ({ step: stringValue(row.step), sessions: numberValue(row.sessions) })),
    features: rows(value.features, (row) => ({
      event: stringValue(row.event),
      surface: nullableString(row.surface),
      mode: nullableString(row.mode),
      outcome: nullableString(row.outcome),
      events: numberValue(row.events),
      sessions: numberValue(row.sessions),
    })),
    failures: rows(value.failures, (row) => ({
      code: stringValue(row.code),
      surface: nullableString(row.surface),
      events: numberValue(row.events),
      sessions: numberValue(row.sessions),
    })),
    historical: {
      practiceSessions: numberValue(historical.practiceSessions),
      completedPracticeSessions: numberValue(historical.completedPracticeSessions),
      practiceTurns: numberValue(historical.practiceTurns),
      completedLessons: numberValue(historical.completedLessons),
      onboardedLearners: numberValue(historical.onboardedLearners),
    },
  };
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-HK", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function formatTimestamp(value: string | null): string {
  if (!value) return "尚未收到新埋點事件";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已開始收集";
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}

function conversionRate(value: number, base: number): string {
  if (base <= 0) return "—";
  return `${Math.round((value / base) * 100)}%`;
}

export default async function ProductAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const requested = Number.parseInt((await searchParams).days ?? "7", 10);
  const days = requested === 30 ? 30 : 7;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect(`/login?next=${encodeURIComponent(`/admin/analytics?days=${days}`)}`);
  }

  const { data, error } = await supabase.rpc("get_product_analytics", { p_days: days });
  if (error) {
    if (error.code === "42501" || error.code === "P0001") notFound();
    console.error("Product analytics query failed", { code: error.code });
    throw new Error("Product analytics are temporarily unavailable");
  }
  const analytics = parseAnalytics(data, days);
  const maxDailySessions = Math.max(1, ...analytics.daily.map((row) => row.sessions));
  const funnelBase = analytics.funnel[0]?.sessions ?? 0;
  const collectionHasStarted = Boolean(analytics.collectionStartedAt);

  const summaryCards = [
    { label: "可量度網站工作階段", value: analytics.summary.sessions, detail: `${analytics.summary.events} 個功能事件`, icon: UsersRound },
    { label: "開始練習", value: analytics.summary.engagedSessions, detail: conversionRate(analytics.summary.engagedSessions, analytics.summary.sessions), icon: Activity },
    { label: "完成錄音", value: analytics.summary.recordingSessions, detail: conversionRate(analytics.summary.recordingSessions, analytics.summary.engagedSessions), icon: Mic2 },
    { label: "收到學習價值", value: analytics.summary.valueSessions, detail: conversionRate(analytics.summary.valueSessions, analytics.summary.engagedSessions), icon: Sparkles },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-12 sm:px-7 lg:px-10 lg:py-16">
        <header className="grid gap-8 border-b border-[#172019] pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow text-[#ad3f29]">Private product analytics</p>
            <h1 className="display-title mt-5 max-w-4xl text-5xl leading-[0.9] sm:text-7xl">學生有沒有真的開口，現在看得清楚。</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#665f55]">
              這裡只顯示匿名、聚合的功能使用訊號。沒有錄音、逐字稿、答案、電郵、IP、裝置資料或原始錯誤內容。
            </p>
          </div>
          <aside className="border-l border-[#ad3f29] pl-5 lg:col-span-3 lg:col-start-10">
            <div className="flex items-center gap-2 text-[#48634c]"><ShieldCheck className="h-4 w-4" /><span className="eyebrow">Admin only</span></div>
            <p className="mt-4 text-sm leading-6 text-[#665f55]">新事件開始：{formatTimestamp(analytics.collectionStartedAt)}</p>
            <p className="mt-2 text-xs leading-5 text-[#81796c]">原始事件滿 90 天後每日刪除；過往練習只以總數作為基線。</p>
          </aside>
        </header>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#665f55]">最近 {analytics.periodDays} 天 · 香港時間</p>
          <nav aria-label="分析時段" className="flex rounded-full border border-[#bdb3a2] bg-[#faf7ef] p-1">
            {[7, 30].map((period) => (
              <Link
                key={period}
                href={`/admin/analytics?days=${period}`}
                aria-current={days === period ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${days === period ? "bg-[#172019] text-white" : "text-[#665f55] hover:bg-[#e8e0cf]"}`}
              >
                {period} 天
              </Link>
            ))}
          </nav>
        </div>

        <section aria-label="核心指標" className="mt-6 grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="bg-[#faf7ef] p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="eyebrow text-[#665f55]">{label}</p>
                <Icon className="h-4 w-4 text-[#48634c]" aria-hidden="true" />
              </div>
              <p className="mt-7 font-mono text-5xl tracking-[-0.08em]">{value}</p>
              <p className="mt-3 text-xs text-[#665f55]">{detail}</p>
            </article>
          ))}
        </section>

        {analytics.summary.events === 0 ? (
          <section className="paper-surface mt-8 grid gap-6 p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow text-[#ad3f29]">{collectionHasStarted ? "No activity in this window" : "Collection not started"}</p>
              <h2 className="mt-3 font-serif text-3xl">{collectionHasStarted ? `最近 ${analytics.periodDays} 天未收到新的功能事件。` : "舊流量不能倒推出每一次點擊。"}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#665f55]">{collectionHasStarted ? "可以切換到 30 天視圖；下面的登入學習基線亦只採用相同時段。" : "開始收集後，網站工作階段、練習、錄音、逐字稿、AI 分析和失敗原因才會進入這套漏斗。下面的歷史基線來自已儲存的登入學習記錄。"}</p>
            </div>
            <Link href="/privacy" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-[#ad3f29] underline-offset-4">查看收集邊界<ArrowRight className="h-4 w-4" /></Link>
          </section>
        ) : null}

        <div className="mt-12 grid gap-10 xl:grid-cols-12">
          <section aria-labelledby="daily-title" className="xl:col-span-7">
            <div className="flex items-center justify-between border-t border-[#172019] pt-5">
              <div><p className="eyebrow text-[#48634c]">Daily activity</p><h2 id="daily-title" className="mt-2 font-serif text-3xl">每天有多少可量度工作階段</h2></div>
              <Clock3 className="h-5 w-5 text-[#48634c]" aria-hidden="true" />
            </div>
            <div className="mt-6 space-y-3">
              {analytics.daily.map((row) => (
                <div key={row.date} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="font-mono text-[11px] text-[#665f55]">{formatDate(row.date)}</span>
                  <div className="h-8 bg-[#e8e0cf]" title={`${row.sessions} 個匿名工作階段`}>
                    <div className="flex h-full min-w-px items-center bg-[#48634c] px-2 text-[10px] text-white" style={{ width: `${(row.sessions / maxDailySessions) * 100}%` }}>
                      {row.valueSessions > 0 ? `${row.valueSessions} 次價值完成` : ""}
                    </div>
                  </div>
                  <span className="text-right font-mono text-sm">{row.sessions}</span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="funnel-title" className="xl:col-span-4 xl:col-start-9">
            <div className="border-t border-[#ad3f29] pt-5">
              <p className="eyebrow text-[#ad3f29]">Speaking funnel</p>
              <h2 id="funnel-title" className="mt-2 font-serif text-3xl">從進入到取得回饋</h2>
            </div>
            <ol className="mt-6 space-y-3">
              {analytics.funnel.map((row, index) => (
                <li key={row.step} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-[#d7cebd] pb-3">
                  <span className="font-mono text-xs text-[#ad3f29]">0{index + 1}</span>
                  <div><p className="text-sm font-semibold">{eventLabels[row.step] ?? row.step}</p><p className="mt-1 text-xs text-[#665f55]">{conversionRate(row.sessions, funnelBase)} 起始轉換</p></div>
                  <span className="font-mono text-2xl">{row.sessions}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-5">
          <div className="border-t border-[#172019] pt-5 lg:col-span-3">
            <p className="eyebrow text-[#48634c]">Feature usage</p>
            <h2 className="mt-2 font-serif text-3xl">他們用了哪些功能</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-left text-sm">
                <thead className="border-b border-[#172019] font-mono text-[10px] uppercase tracking-[0.14em] text-[#665f55]"><tr><th className="py-3 pr-4">功能</th><th className="px-4 py-3">位置</th><th className="px-4 py-3">結果</th><th className="px-4 py-3 text-right">工作階段</th><th className="py-3 pl-4 text-right">事件</th></tr></thead>
                <tbody>
                  {analytics.features.map((row) => (
                    <tr key={`${row.event}-${row.surface}-${row.mode}-${row.outcome}`} className="border-b border-[#d7cebd]"><td className="py-4 pr-4 font-semibold">{eventLabels[row.event] ?? row.event}</td><td className="px-4 py-4 text-[#665f55]">{row.surface ? (surfaceLabels[row.surface] ?? row.surface) : "—"}{row.mode ? ` · ${row.mode === "group-discussion" ? "GD" : "IR"}` : ""}</td><td className="px-4 py-4 text-[#665f55]">{row.outcome ? (outcomeLabels[row.outcome] ?? row.outcome) : "—"}</td><td className="px-4 py-4 text-right font-mono">{row.sessions}</td><td className="py-4 pl-4 text-right font-mono">{row.events}</td></tr>
                  ))}
                  {analytics.features.length === 0 ? <tr><td colSpan={5} className="py-7 text-[#665f55]">收到第一個事件後，這裡會開始排序。</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="border-t border-[#ad3f29] pt-5 lg:col-span-2">
            <div className="flex items-center justify-between"><div><p className="eyebrow text-[#ad3f29]">Failure signals</p><h2 className="mt-2 font-serif text-3xl">哪裡把學生卡住</h2></div><TriangleAlert className="h-5 w-5 text-[#ad3f29]" aria-hidden="true" /></div>
            {analytics.failures.length > 0 ? <ul className="mt-6 space-y-3">{analytics.failures.map((row) => <li key={`${row.code}-${row.surface}`} className="flex items-start justify-between gap-4 border-b border-[#d7cebd] pb-3"><div><p className="font-mono text-xs">{row.code}</p><p className="mt-1 text-xs text-[#665f55]">{row.surface ? (surfaceLabels[row.surface] ?? row.surface) : "未知位置"} · {row.sessions} 個工作階段</p></div><span className="font-mono text-xl">{row.events}</span></li>)}</ul> : <p className="mt-6 border border-[#b9c7ba] bg-[#e5ebe4] p-4 text-sm leading-6 text-[#48634c]">目前沒有收到失敗事件。樣本仍少時，這不等於線上沒有問題。</p>}
          </aside>
        </section>

        <section className="mt-14 border-t border-[#172019] pt-6">
          <p className="eyebrow text-[#665f55]">最近 {analytics.periodDays} 天的登入學習基線</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["已儲存練習", analytics.historical.practiceSessions],
              ["完成練習", analytics.historical.completedPracticeSessions],
              ["討論回合", analytics.historical.practiceTurns],
              ["完成短課", analytics.historical.completedLessons],
              ["完成首次體驗", analytics.historical.onboardedLearners],
            ].map(([label, value]) => <article key={String(label)} className="border-l border-[#bdb3a2] pl-4"><p className="text-xs text-[#665f55]">{label}</p><p className="mt-2 font-mono text-3xl">{value}</p></article>)}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-6 text-[#81796c]">這組資料來自登入用戶在相同時段內已儲存的學習成果，與匿名事件工作階段不能直接相加，也不能代表全部訪客。可量度工作階段也不包括關閉分析、啟用 Do Not Track 或沒有執行 JavaScript 的訪客；總訪問量仍以 Cloudflare 頁面統計為準。</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
