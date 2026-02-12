import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Users, Clock, FileText, BookOpen, MessageSquare, User } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative dot-grid">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02)_0%,transparent_60%)]" />
        <div className="hidden sm:block absolute top-20 right-[10%] w-72 h-72 bg-neutral-100/60 rounded-full blur-3xl animate-float" />
        <div className="hidden sm:block absolute bottom-10 left-[5%] w-56 h-56 bg-neutral-50 rounded-full blur-3xl animate-float delay-300" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="pt-16 sm:pt-28 pb-14 sm:pb-24">
            {/* Badge */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-1.5 text-[12px] text-neutral-500 tracking-wide uppercase mb-8 bg-white/80 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DSE English Paper 4
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-up delay-100 font-serif text-[38px] sm:text-[72px] lg:text-[84px] leading-[0.98] sm:leading-[0.95] font-semibold text-neutral-900 tracking-tight max-w-4xl">
              Practice speaking,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 via-neutral-500 to-neutral-300 italic">
                together.
              </span>
            </h1>

            {/* Subtext */}
            <p className="animate-fade-up delay-200 text-[15px] sm:text-[19px] leading-relaxed text-neutral-500 mt-6 sm:mt-8 mb-9 sm:mb-12 max-w-xl">
              找到隊友，選擇歷年真題，完整模擬 DSE Speaking 考試。從準備閱讀、小組討論到個人回應，全流程線上練習。
            </p>

            {/* CTA */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/rooms" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto min-h-11 h-12 px-8 text-[15px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5">
                  開始練習
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/rooms" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto min-h-11 h-12 px-7 text-[15px] text-neutral-600 border-neutral-200 rounded-full hover:bg-neutral-50"
                >
                  瀏覽房間
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="animate-fade-up delay-500 grid grid-cols-2 sm:flex sm:flex-wrap items-start sm:items-center gap-5 sm:gap-8 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-neutral-100">
              {[
                { value: "228", label: "歷年真題" },
                { value: "2012–2023", label: "年份涵蓋" },
                { value: "4 人", label: "小組討論" },
                { value: "19 min", label: "完整模擬" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[22px] sm:text-[26px] font-serif font-semibold text-neutral-900 tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker bar ── */}
      <div className="border-y border-neutral-100 bg-neutral-50/50 py-3 overflow-hidden">
        <div className="animate-ticker flex whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-8 px-4">
              {[
                "Group Discussion", "Individual Response", "Past Papers",
                "Real-time Voice", "Auto Timer", "2012-2023 Topics",
                "WebRTC Powered", "Exam Simulation", "4-Person Teams",
                "Group Discussion", "Individual Response", "Past Papers",
              ].map((text, i) => (
                <span key={`${idx}-${i}`} className="text-[11px] sm:text-[12px] text-neutral-400 uppercase tracking-[0.15em] flex items-center gap-8">
                  {text}
                  <span className="text-neutral-200">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-32">
        <div className="text-center mb-12 sm:mb-20">
          <p className="text-[12px] text-neutral-400 tracking-[0.2em] uppercase mb-4">
            How it works
          </p>
          <h2 className="font-serif text-[28px] sm:text-[44px] font-semibold text-neutral-900 tracking-tight leading-[1.1]">
            三個階段，<br className="sm:hidden" />一次完整模擬
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              num: "01",
              icon: BookOpen,
              title: "Preparation",
              zh: "準備階段",
              time: "10 min",
              desc: "閱讀文章與討論問題，在筆記區整理要點。如同真實考試，安靜準備。",
              gradient: "from-amber-50 to-orange-50/50",
            },
            {
              num: "02",
              icon: MessageSquare,
              title: "Group Discussion",
              zh: "小組討論",
              time: "8 min",
              desc: "四人圍繞三個引導問題展開自由討論，語音視訊即時溝通，模擬面對面交流。",
              gradient: "from-sky-50 to-blue-50/50",
            },
            {
              num: "03",
              icon: User,
              title: "Individual Response",
              zh: "個人回應",
              time: "1 min each",
              desc: "輪流回答考官的跟進問題，展示獨立思考和臨場表達能力。",
              gradient: "from-violet-50 to-purple-50/50",
            },
          ].map((item) => (
            <div
              key={item.num}
              className={`group relative rounded-2xl bg-gradient-to-br ${item.gradient} border border-neutral-100 p-6 sm:p-8 hover-lift`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-neutral-100 shadow-sm">
                  <item.icon className="h-4.5 w-4.5 text-neutral-600" />
                </div>
                <span className="text-[11px] text-neutral-400 font-mono border border-neutral-200/60 rounded-full px-2.5 py-0.5 bg-white/80">
                  {item.time}
                </span>
              </div>
              <p className="text-[48px] font-serif text-neutral-100 font-bold leading-none mb-4 select-none">
                {item.num}
              </p>
              <h3 className="font-serif text-[22px] font-semibold text-neutral-900 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[13px] text-neutral-400 mt-1 mb-3">{item.zh}</p>
              <p className="text-[14px] text-neutral-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Process flow line (desktop) */}
        <div className="hidden md:flex items-center justify-center gap-2 mt-8">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-neutral-200" />
          <span className="text-[11px] text-neutral-300 uppercase tracking-widest">complete flow</span>
          <div className="h-px w-24 bg-gradient-to-r from-neutral-200 to-transparent" />
        </div>
      </section>

      {/* ── Bento Features Grid ── */}
      <section className="bg-neutral-950 text-white grain">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-32">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[12px] text-neutral-500 tracking-[0.2em] uppercase mb-4">
              Features
            </p>
            <h2 className="font-serif text-[28px] sm:text-[44px] font-semibold text-white tracking-tight leading-[1.1]">
              為 DSE 口試而生
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card: Past Papers - Large */}
            <div className="md:col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.07] transition-colors group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06]">
                  <FileText className="h-5 w-5 text-neutral-400" />
                </div>
                <span className="font-serif text-[56px] font-bold text-white/[0.06] leading-none select-none group-hover:text-white/[0.1] transition-colors">
                  228
                </span>
              </div>
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-2">
                歷年真題庫
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed max-w-md">
                完整收錄 2012–2023 年 DSE Speaking 真題。每份試卷包含閱讀材料、三個討論問題和多個個人回應題目，還原考場真實體驗。
              </p>
            </div>

            {/* Card: Voice */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Mic className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                即時音視訊
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                WebRTC 驅動的高畫質音視訊。討論階段自動開啟麥克風，如同面對面交流。
              </p>
            </div>

            {/* Card: Timer */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Clock className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                自動計時
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                嚴格按考試時間分配，階段到時自動切換。練習節奏完全對標真實考試。
              </p>
            </div>

            {/* Card: Teamup */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Users className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                線上組隊
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                建立或加入房間，等待 3–4 人即可開始。隨時找到練習夥伴。
              </p>
            </div>

            {/* Card: Assessment - spanning */}
            <div className="md:col-span-2 lg:col-span-1 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] p-6 sm:p-8 hover:bg-white/[0.07] transition-colors">
              <p className="text-[12px] text-neutral-500 tracking-[0.15em] uppercase mb-5">
                Assessment Criteria
              </p>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-5">
                評分標準
              </h3>
              <div className="space-y-3">
                {[
                  { en: "Pronunciation & Expression", pct: 25 },
                  { en: "Communication Strategy", pct: 25 },
                  { en: "Vocabulary & Language", pct: 25 },
                  { en: "Ideas & Organisation", pct: 25 },
                ].map((item) => (
                  <div key={item.en}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] text-neutral-400">{item.en}</span>
                      <span className="text-[12px] text-neutral-500 font-mono">{item.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neutral-500 to-neutral-400"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative dot-grid">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.02)_0%,transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-36 text-center">
          <h2 className="font-serif text-[32px] sm:text-[52px] font-semibold text-neutral-900 tracking-tight leading-[1.05] mb-5">
            Ready to practice?
          </h2>
          <p className="text-[16px] sm:text-[18px] text-neutral-400 mb-10 max-w-md mx-auto leading-relaxed">
            加入平台，找到練習夥伴，<br className="hidden sm:block" />一起為 DSE Speaking 做準備。
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto min-h-11 h-12 px-8 text-[15px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5">
                免費註冊
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/rooms" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto min-h-11 h-12 px-7 text-[15px] text-neutral-600 border-neutral-200 rounded-full hover:bg-neutral-50"
              >
                瀏覽房間
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="font-serif text-[15px] font-semibold text-neutral-900 tracking-tight">
                DSE Speaking
              </span>
              <span className="hidden sm:block h-4 w-px bg-neutral-200" />
              <span className="text-[12px] text-neutral-400">
                Built for DSE candidates
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/rooms" className="inline-flex min-h-11 items-center px-3 text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Rooms
              </Link>
              <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Login
              </Link>
              <Link href="/register" className="inline-flex min-h-11 items-center px-3 text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
