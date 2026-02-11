import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="pt-24 sm:pt-32 pb-20 sm:pb-28 max-w-2xl">
          <p className="text-[13px] text-neutral-400 tracking-wide uppercase mb-5">
            DSE English Paper 4
          </p>
          <h1 className="font-serif text-[40px] sm:text-[56px] leading-[1.08] font-semibold text-neutral-900 mb-6 tracking-tight">
            Practice speaking,
            <br />
            <span className="text-neutral-400 italic">together.</span>
          </h1>
          <p className="text-[17px] leading-relaxed text-neutral-500 mb-10 max-w-lg">
            找到队友，选择历年真题，完整模拟 DSE Speaking 考试 ——
            从准备阅读、小组讨论到个人回应，全流程在线练习。
          </p>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <Button className="h-11 px-7 text-[14px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full">
                开始练习
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/rooms">
              <Button
                variant="ghost"
                className="h-11 px-5 text-[14px] text-neutral-500 hover:text-neutral-900"
              >
                浏览房间
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100" />

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <p className="text-[13px] text-neutral-400 tracking-wide uppercase mb-3">
          How it works
        </p>
        <h2 className="font-serif text-[28px] sm:text-[36px] font-semibold text-neutral-900 mb-16 tracking-tight leading-tight">
          三个阶段，一次完整的模拟练习
        </h2>
        <div className="grid md:grid-cols-3 gap-x-12 gap-y-10">
          {[
            {
              num: "01",
              title: "Preparation",
              zh: "准备阶段",
              time: "10 min",
              desc: "阅读文章与讨论问题，在笔记区整理要点。如同真实考试，安静准备。",
            },
            {
              num: "02",
              title: "Group Discussion",
              zh: "小组讨论",
              time: "8 min",
              desc: "四人围绕三个引导问题展开自由讨论，开启语音视频，模拟面对面交流。",
            },
            {
              num: "03",
              title: "Individual Response",
              zh: "个人回应",
              time: "1 min each",
              desc: "轮流回答考官的跟进问题，展示独立思考和临场表达能力。",
            },
          ].map((item) => (
            <div key={item.num}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[13px] font-mono text-neutral-300">
                  {item.num}
                </span>
                <span className="text-[11px] text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
                  {item.time}
                </span>
              </div>
              <h3 className="font-serif text-[20px] font-semibold text-neutral-900 mb-1 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[13px] text-neutral-400 mb-3">{item.zh}</p>
              <p className="text-[15px] text-neutral-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100" />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-[13px] text-neutral-400 tracking-wide uppercase mb-3">
              Features
            </p>
            <h2 className="font-serif text-[28px] sm:text-[36px] font-semibold text-neutral-900 mb-6 tracking-tight leading-tight">
              为 DSE 口试设计
            </h2>
            <p className="text-[15px] text-neutral-500 leading-relaxed mb-10 max-w-md">
              平台围绕 DSE Speaking 的实际需求构建。
              228 份历年真题、实时音视频、自动计时与阶段切换，
              让每一次练习都尽可能接近真实考试体验。
            </p>
            <div className="space-y-5">
              {[
                {
                  label: "在线组队",
                  detail: "创建或加入房间，等待 3-4 人即可开始",
                },
                {
                  label: "实时音视频",
                  detail: "WebRTC 驱动，讨论阶段自动开启麦克风与摄像头",
                },
                {
                  label: "历年真题",
                  detail: "228 份真题覆盖 2012-2025，含文章、讨论问题和个人回应题目",
                },
                {
                  label: "自动计时",
                  detail: "严格按考试时间分配，阶段到时自动切换",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 shrink-0 group-hover:bg-neutral-900 transition-colors" />
                  <div>
                    <p className="text-[15px] font-medium text-neutral-900">
                      {f.label}
                    </p>
                    <p className="text-[14px] text-neutral-400 mt-0.5">
                      {f.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring criteria */}
          <div className="border border-neutral-150 rounded-lg p-8 bg-neutral-50/50">
            <p className="text-[13px] text-neutral-400 tracking-wide uppercase mb-4">
              Assessment Criteria
            </p>
            <h3 className="font-serif text-[22px] font-semibold text-neutral-900 mb-6 tracking-tight">
              评分标准
            </h3>
            <p className="text-[14px] text-neutral-500 mb-8 leading-relaxed">
              Paper 4 占 DSE 英文总分 10%，采用四项均等权重的评分体系，每项各占 25%。
            </p>
            <div className="space-y-4">
              {[
                { en: "Pronunciation & Expression", zh: "发音与表达" },
                { en: "Communication Strategy", zh: "沟通策略" },
                { en: "Vocabulary & Language Patterns", zh: "词汇与语言" },
                { en: "Ideas & Organisation", zh: "观点与组织" },
              ].map((item, i) => (
                <div
                  key={item.en}
                  className="flex items-center justify-between py-3 border-b border-neutral-200/60 last:border-0"
                >
                  <div>
                    <p className="text-[14px] text-neutral-900">{item.en}</p>
                    <p className="text-[13px] text-neutral-400">{item.zh}</p>
                  </div>
                  <span className="text-[13px] font-mono text-neutral-400">
                    25%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100" />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 text-center">
        <h2 className="font-serif text-[28px] sm:text-[36px] font-semibold text-neutral-900 mb-4 tracking-tight">
          Ready to practice?
        </h2>
        <p className="text-[15px] text-neutral-400 mb-8 max-w-md mx-auto">
          加入平台，找到练习伙伴，一起为 DSE Speaking 做准备。
        </p>
        <Link href="/register">
          <Button className="h-11 px-8 text-[14px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full">
            免费注册
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between">
            <span className="font-serif text-[14px] text-neutral-400">
              DSE Speaking
            </span>
            <span className="text-[12px] text-neutral-300">
              Built for DSE candidates
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
