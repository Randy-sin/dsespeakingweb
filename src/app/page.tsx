import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Users, Clock, FileText, BookOpen, MessageSquare, User } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative dot-grid">
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02)_0%,transparent_60%)]" />
        <div className="absolute top-20 right-[10%] w-72 h-72 bg-neutral-100/60 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-[5%] w-56 h-56 bg-neutral-50 rounded-full blur-3xl animate-float delay-300" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="pt-20 sm:pt-28 pb-20 sm:pb-24">
            {/* Badge */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 border border-neutral-200 rounded-full px-4 py-1.5 text-[12px] text-neutral-500 tracking-wide uppercase mb-8 bg-white/80 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DSE English Paper 4
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-up delay-100 font-serif text-[48px] sm:text-[72px] lg:text-[84px] leading-[0.95] font-semibold text-neutral-900 tracking-tight max-w-4xl">
              Practice speaking,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 via-neutral-500 to-neutral-300 italic">
                together.
              </span>
            </h1>

            {/* Subtext */}
            <p className="animate-fade-up delay-200 text-[17px] sm:text-[19px] leading-relaxed text-neutral-500 mt-8 mb-12 max-w-xl">
              找到队友，选择历年真题，完整模拟 DSE Speaking 考试。从准备阅读、小组讨论到个人回应，全流程在线练习。
            </p>

            {/* CTA */}
            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-4">
              <Link href="/rooms">
                <Button className="h-12 px-8 text-[15px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5">
                  开始练习
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/rooms">
                <Button
                  variant="outline"
                  className="h-12 px-7 text-[15px] text-neutral-600 border-neutral-200 rounded-full hover:bg-neutral-50"
                >
                  浏览房间
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="animate-fade-up delay-500 flex flex-wrap items-center gap-8 mt-16 pt-8 border-t border-neutral-100">
              {[
                { value: "228", label: "历年真题" },
                { value: "2012–2023", label: "年份覆盖" },
                { value: "4 人", label: "小组讨论" },
                { value: "19 min", label: "完整模拟" },
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
                <span key={`${idx}-${i}`} className="text-[12px] text-neutral-400 uppercase tracking-[0.15em] flex items-center gap-8">
                  {text}
                  <span className="text-neutral-200">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-[12px] text-neutral-400 tracking-[0.2em] uppercase mb-4">
            How it works
          </p>
          <h2 className="font-serif text-[32px] sm:text-[44px] font-semibold text-neutral-900 tracking-tight leading-[1.1]">
            三个阶段，<br className="sm:hidden" />一次完整模拟
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              icon: BookOpen,
              title: "Preparation",
              zh: "准备阶段",
              time: "10 min",
              desc: "阅读文章与讨论问题，在笔记区整理要点。如同真实考试，安静准备。",
              gradient: "from-amber-50 to-orange-50/50",
            },
            {
              num: "02",
              icon: MessageSquare,
              title: "Group Discussion",
              zh: "小组讨论",
              time: "8 min",
              desc: "四人围绕三个引导问题展开自由讨论，语音视频实时沟通，模拟面对面交流。",
              gradient: "from-sky-50 to-blue-50/50",
            },
            {
              num: "03",
              icon: User,
              title: "Individual Response",
              zh: "个人回应",
              time: "1 min each",
              desc: "轮流回答考官的跟进问题，展示独立思考和临场表达能力。",
              gradient: "from-violet-50 to-purple-50/50",
            },
          ].map((item) => (
            <div
              key={item.num}
              className={`group relative rounded-2xl bg-gradient-to-br ${item.gradient} border border-neutral-100 p-7 sm:p-8 hover-lift`}
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
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="text-center mb-16">
            <p className="text-[12px] text-neutral-500 tracking-[0.2em] uppercase mb-4">
              Features
            </p>
            <h2 className="font-serif text-[32px] sm:text-[44px] font-semibold text-white tracking-tight leading-[1.1]">
              为 DSE 口试而生
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card: Past Papers - Large */}
            <div className="sm:col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06]">
                  <FileText className="h-5 w-5 text-neutral-400" />
                </div>
                <span className="font-serif text-[56px] font-bold text-white/[0.06] leading-none select-none group-hover:text-white/[0.1] transition-colors">
                  228
                </span>
              </div>
              <h3 className="font-serif text-[22px] font-semibold text-white tracking-tight mb-2">
                历年真题库
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed max-w-md">
                完整收录 2012–2023 年 DSE Speaking 真题。每份试卷包含阅读材料、三个讨论问题和多个个人回应题目，还原考场真实体验。
              </p>
            </div>

            {/* Card: Voice */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Mic className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                实时音视频
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                WebRTC 驱动的高清音视频。讨论阶段自动开启麦克风，如同面对面交流。
              </p>
            </div>

            {/* Card: Timer */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Clock className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                自动计时
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                严格按考试时间分配，阶段到时自动切换。练习节奏完全对标真实考试。
              </p>
            </div>

            {/* Card: Teamup */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.06] mb-6">
                <Users className="h-5 w-5 text-neutral-400" />
              </div>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-2">
                在线组队
              </h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed">
                创建或加入房间，等待 3–4 人即可开始。随时找到练习伙伴。
              </p>
            </div>

            {/* Card: Assessment - spanning */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] p-8 hover:bg-white/[0.07] transition-colors">
              <p className="text-[12px] text-neutral-500 tracking-[0.15em] uppercase mb-5">
                Assessment Criteria
              </p>
              <h3 className="font-serif text-[19px] font-semibold text-white tracking-tight mb-5">
                评分标准
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
                      <span className="text-[12px] text-neutral-400">{item.en}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">{item.pct}%</span>
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
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-28 sm:py-36 text-center">
          <h2 className="font-serif text-[36px] sm:text-[52px] font-semibold text-neutral-900 tracking-tight leading-[1.05] mb-5">
            Ready to practice?
          </h2>
          <p className="text-[16px] sm:text-[18px] text-neutral-400 mb-10 max-w-md mx-auto leading-relaxed">
            加入平台，找到练习伙伴，<br className="hidden sm:block" />一起为 DSE Speaking 做准备。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 text-[15px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5">
                免费注册
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/rooms">
              <Button
                variant="outline"
                className="h-12 px-7 text-[15px] text-neutral-600 border-neutral-200 rounded-full hover:bg-neutral-50"
              >
                浏览房间
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
            <div className="flex items-center gap-6">
              <Link href="/rooms" className="text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Rooms
              </Link>
              <Link href="/login" className="text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-[12px] text-neutral-400 hover:text-neutral-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
