import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Users, Flame } from "lucide-react";
import { speaking2026Papers } from "@/lib/papers/speaking-2026";

export const metadata: Metadata = {
  title: "2026 DSE Speaking 題目 | DSE Speaking",
  description:
    "2026 DSE Speaking Paper 1.1, 1.2, 1.3 題目整理，包含 Part A Discussion Points 和 Part B Individual Response 題目。",
};

export default function Speaking2026Page() {
  const completePapers = speaking2026Papers.filter(
    (p) => p.status === "complete"
  ).length;

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <Navbar />

      {/* Header */}
      <section className="border-b border-neutral-200/80 bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
          <Link
            href="/papers"
            className="inline-flex items-center gap-2 text-[13px] text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回真題庫
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Flame className="h-8 w-8 text-white" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-medium text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  持續更新中
                </span>
              </div>
              <h1 className="font-serif text-[36px] leading-tight text-white sm:text-[52px]">
                2026 DSE Speaking
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/90">
                已收錄 {speaking2026Papers.length} 份題目，{completePapers} 份包含完整 Part A + Part B
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/rooms">
                <Button className="h-11 rounded-full bg-white px-6 text-[14px] font-medium text-neutral-900 hover:bg-white/90">
                  <Users className="mr-2 h-4 w-4" />
                  開始練習
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Papers Grid */}
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-1">
          {speaking2026Papers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)] sm:p-8"
            >
              {/* Paper Header */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="rounded-full bg-neutral-900 px-4 py-1.5 text-[13px] font-semibold text-white">
                  Paper {paper.paperNumber}
                </span>
                <h2 className="font-serif text-[26px] leading-tight text-neutral-950 sm:text-[32px]">
                  {paper.topic}
                </h2>
                <span
                  className={`ml-auto rounded-full px-3 py-1 text-[12px] font-medium ${
                    paper.status === "complete"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {paper.status === "complete" ? "完整" : "部分"}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Part A */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">
                      Part A · Group Discussion
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {paper.partADiscussionPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex gap-3 rounded-2xl bg-blue-50/70 px-5 py-4"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[12px] font-semibold text-blue-700">
                          {idx + 1}
                        </span>
                        <span className="text-[15px] leading-relaxed text-neutral-800">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Part B */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                      <span className="text-[14px] font-bold text-violet-600">B</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">
                      Part B · Individual Response
                    </h3>
                  </div>
                  {paper.partBQuestions && paper.partBQuestions.length > 0 ? (
                    <ul className="space-y-3">
                      {paper.partBQuestions.map((q, idx) => (
                        <li
                          key={idx}
                          className="flex gap-3 rounded-2xl bg-violet-50/70 px-5 py-4"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[12px] font-semibold text-violet-700">
                            {idx + 1}
                          </span>
                          <span className="text-[15px] leading-relaxed text-neutral-800">
                            {q}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-5 py-8 text-center">
                      <p className="text-[14px] text-neutral-400">Part B 題目待補充</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 rounded-2xl bg-neutral-100 px-6 py-5 text-center">
          <p className="text-[14px] text-neutral-600">
            題目來源自考生分享，持續更新中。如有更多題目歡迎到
            <Link href="/forum" className="mx-1 font-medium text-neutral-900 underline underline-offset-2">
              論壇
            </Link>
            分享。
          </p>
        </div>
      </section>
    </div>
  );
}
