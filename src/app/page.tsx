import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpenText,
  Check,
  MessageCircleMore,
  Mic2,
  PenLine,
} from "lucide-react";
import { HomePrimaryAction } from "@/components/home/home-primary-action";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "HKDSE English Paper 4 口試教學與 AI 練習",
  description:
    "免費學習 DSE Speaking Group Discussion 與 Individual Response 答題方法，用歷屆真題錄音練習並取得逐字稿證據化 AI 回饋。",
  path: "/",
});

const learningSteps = [
  {
    number: "01",
    title: "先開口",
    description: "不用先填表或寫稿；看清題目，按下錄音，用自己的英文完整說一次。",
    icon: Mic2,
  },
  {
    number: "02",
    title: "回聽再理解",
    description: "先聽自己真正說過的內容，再用短課看清結構、互動策略和下一個重點。",
    icon: BookOpenText,
  },
  {
    number: "03",
    title: "有方向地改",
    description: "按照內容、語言、表達和互動四個維度完成下一輪練習。",
    icon: PenLine,
  },
];

const paperPrompts = [
  {
    year: "2026",
    title: "Promoting reading culture",
    focus: "小組討論 · 校園生活",
  },
  {
    year: "2025",
    title: "A meaningful school visit",
    focus: "個人回應 · 個人經驗",
  },
  {
    year: "2024",
    title: "Healthy use of technology",
    focus: "個人回應 · 發表意見",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f3efe4]">
      <Navbar />

      <main id="main-content">
        <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-16 sm:px-7 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:py-20">
          <div className="lg:col-span-7 lg:pr-12">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#ad3f29]" />
              <p className="eyebrow text-[#665f55]">HKDSE English Paper 4</p>
            </div>

            <h1 className="display-title max-w-[780px] text-[clamp(4rem,9vw,8.8rem)] leading-[0.78] text-[#172019]">
              Learn what
              <span className="ml-[0.7em] block italic text-[#ad3f29]">to say.</span>
              <span className="block">Say it better.</span>
            </h1>

            <div className="mt-10 grid max-w-2xl gap-7 border-l border-[#a9a08f] pl-5 sm:grid-cols-[1fr_auto] sm:items-end sm:pl-8">
              <p className="max-w-xl text-[17px] leading-8 text-[#5e5b53] sm:text-[19px]">
                先看清題目，按下麥克風，直接用自己的英文說一次；說完再學如何開始、回應、展開、轉題與總結。
              </p>
              <HomePrimaryAction />
            </div>
          </div>

          <div className="reveal-up reveal-up-delay-2 relative lg:col-span-5 lg:pl-4">
            <div className="absolute -left-2 top-5 hidden h-40 w-px bg-[#ad3f29] lg:block" />
            <p className="absolute -left-8 top-52 hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[#665f55] [writing-mode:vertical-rl] lg:block">
              Today&apos;s micro lesson
            </p>
            <article className="paper-surface margin-note paper-rule relative mx-auto max-w-[520px] px-6 py-7 sm:px-10 sm:py-10">
              <div className="flex items-center justify-between border-b border-[#bdb3a2] pb-4">
                <span className="eyebrow text-[#48634c]">Group Discussion · 01</span>
                <span className="rounded-full border border-[#bdb3a2] px-3 py-1 font-mono text-[10px] text-[#6d695f]">8 MIN</span>
              </div>

              <div className="py-8">
                <p className="font-serif text-[13px] italic text-[#665f55]">Respond &amp; Build</p>
                <h2 className="mt-2 font-serif text-[38px] leading-tight tracking-[-0.04em] sm:text-[48px]">回應，再加入新資訊</h2>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-[#5e5b53]">
                  有效互動不是只說 I agree，而是指出對方的觀點、表明你的反應，再加入一項新資訊。
                </p>
              </div>

              <div className="space-y-3 border-y border-[#bdb3a2] py-5">
                {["接住一個關鍵詞", "補充理由或例子", "把問題交給下一位"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#48634c] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <Link href="/learn/group-discussion/respond-and-build" className="mt-6 flex items-center justify-between text-sm font-semibold">
                開始這一課
                <ArrowDownRight className="h-5 w-5 text-[#ad3f29]" />
              </Link>
            </article>
          </div>
        </section>

        <div className="border-y border-[#172019] bg-[#172019] py-3 text-[#faf7ef]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 overflow-hidden px-4 font-mono text-[10px] uppercase tracking-[0.18em] sm:px-7 lg:px-10">
            <span className="shrink-0">Methods before marks</span>
            <span className="h-px min-w-12 flex-1 bg-[#6f786f]" />
            <span className="shrink-0">Group Discussion</span>
            <span className="hidden h-px min-w-12 flex-1 bg-[#6f786f] sm:block" />
            <span className="hidden shrink-0 sm:block">Individual Response</span>
            <span className="hidden h-px min-w-12 flex-1 bg-[#6f786f] md:block" />
            <span className="hidden shrink-0 md:block">Practice with purpose</span>
          </div>
        </div>

        <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-7 lg:px-10 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow text-[#ad3f29]">A repeatable learning loop</p>
              <h2 className="display-title mt-4 max-w-sm text-5xl leading-[0.92] sm:text-6xl">每一次練習，都知道自己在改善甚麼。</h2>
            </div>
            <div className="lg:col-span-8 lg:pl-10">
              {learningSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.number} className="group grid gap-5 border-t border-[#9f9687] py-7 sm:grid-cols-[56px_1fr_48px] sm:items-start">
                    <span className="font-mono text-xs text-[#665f55]">{step.number}</span>
                    <div>
                      <h3 className="font-serif text-3xl tracking-[-0.03em]">{step.title}</h3>
                      <p className="mt-2 max-w-xl text-[15px] leading-7 text-[#6d695f]">{step.description}</p>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-[#9f9687] transition-colors group-hover:bg-[#48634c] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-[#d0c6b5] bg-[#e8e0cf]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <article className="group flex min-h-[560px] flex-col border-b border-[#bdb3a2] p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-14">
              <div className="flex items-start justify-between">
                <span className="eyebrow text-[#48634c]">Track A · Interaction</span>
                <MessageCircleMore className="h-8 w-8 stroke-[1.25]" />
              </div>
              <div className="my-auto py-14">
                <p className="font-mono text-xs text-[#665f55]">6 SHORT LESSONS</p>
                <h2 className="display-title mt-4 text-[clamp(3.3rem,6vw,6.5rem)] leading-[0.84]">Group<br /><span className="italic text-[#48634c]">Discussion</span></h2>
                <p className="mt-7 max-w-lg text-base leading-8 text-[#5e5b53]">學會開場、接話、反駁、澄清、邀請、轉題與總結。重點不是搶著說，而是令整組討論向前。</p>
              </div>
              <Link href="/learn/group-discussion" className="flex items-center justify-between border-t border-[#bdb3a2] pt-5 text-sm font-semibold">
                查看小組討論學習路徑
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>

            <article className="group flex min-h-[560px] flex-col bg-[#faf7ef] p-6 sm:p-10 lg:p-14">
              <div className="flex items-start justify-between">
                <span className="eyebrow text-[#ad3f29]">Track B · Structure</span>
                <Mic2 className="h-8 w-8 stroke-[1.25]" />
              </div>
              <div className="my-auto py-14">
                <p className="font-mono text-xs text-[#665f55]">5 RESPONSE TYPES</p>
                <h2 className="display-title mt-4 text-[clamp(3.3rem,6vw,6.5rem)] leading-[0.84]">Individual<br /><span className="italic text-[#ad3f29]">Response</span></h2>
                <p className="mt-7 max-w-lg text-base leading-8 text-[#5e5b53]">掌握選擇、建議、經驗、原因與意見五種常見題型。從 1 分鐘準備到完整錄音，建立穩定答案骨架。</p>
              </div>
              <Link href="/learn/individual-response" className="flex items-center justify-between border-t border-[#bdb3a2] pt-5 text-sm font-semibold">
                查看個人回應學習路徑
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-7 lg:px-10 lg:py-32">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-[#665f55]">Past paper practice</p>
              <h2 className="display-title mt-3 text-5xl sm:text-6xl">把方法帶入真題。</h2>
            </div>
            <Link href="/papers" className="flex items-center gap-2 text-sm font-semibold underline decoration-[#ad3f29] underline-offset-8">
              瀏覽全部題目 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] md:grid-cols-3">
            {paperPrompts.map((paper) => (
              <Link key={`${paper.year}-${paper.title}`} href="/papers" className="group flex min-h-72 flex-col bg-[#f3efe4] p-6 transition-colors hover:bg-[#faf7ef] sm:p-8">
                <span className="font-mono text-xs text-[#ad3f29]">{paper.year}</span>
                <h3 className="mt-12 font-serif text-3xl leading-tight tracking-[-0.03em]">{paper.title}</h3>
                <div className="mt-auto flex items-end justify-between border-t border-[#bdb3a2] pt-5">
                  <span className="text-xs text-[#6d695f]">{paper.focus}</span>
                  <ArrowDownRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#48634c] text-[#faf7ef]">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-7 lg:grid-cols-12 lg:px-10 lg:py-28">
            <div className="lg:col-span-8">
              <p className="eyebrow text-[#eee7da]">Start with your voice</p>
              <h2 className="display-title mt-5 max-w-4xl text-5xl leading-[0.92] sm:text-7xl">不用先填表。直接說一次。</h2>
            </div>
            <div className="flex flex-col justify-end lg:col-span-4">
              <p className="mb-7 text-[15px] leading-7 text-[#e4ded2]">看一條題目，錄下第一個回答；說完才回聽、學方法和選下一步。</p>
              <HomePrimaryAction placement="closing" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
