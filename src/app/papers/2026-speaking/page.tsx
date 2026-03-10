import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  Clock3,
  NotebookTabs,
  MessageSquareText,
  Download,
  MessageCircle,
} from "lucide-react";
import {
  speaking2026Intro,
  speaking2026Slots,
  speaking2026UpdatePlan,
  speaking2026Papers,
} from "@/lib/papers/speaking-2026";

export const metadata: Metadata = {
  title: "2026 DSE Speaking Past Paper",
  description:
    "2026 DSE Speaking Past Paper 專頁。集中整理原始 PDF、題目結構與後續補充內容。",
};

export default function Speaking2026Page() {
  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <Navbar />

      <section className="border-b border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
          <Link
            href="/papers"
            className="inline-flex items-center gap-2 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回真題庫
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[12px] uppercase tracking-[0.24em] text-neutral-400">
                2026 Speaking Special Page
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-[40px] leading-[0.92] text-neutral-950 sm:text-[68px]">
                {speaking2026Intro.title}
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-neutral-600">
                {speaking2026Intro.subtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  disabled
                  className="h-11 rounded-full bg-neutral-900 px-6 text-[14px] text-white disabled:opacity-100"
                >
                  <Download className="h-4 w-4" />
                  PDF 待補
                </Button>
                <Link href="/forum">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-neutral-200 px-6 text-[14px] text-neutral-600"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    去論壇看討論
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-neutral-200/80 bg-[#fbfaf6] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.24)]">
              <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                Page principle
              </p>
              <div className="mt-5 space-y-3">
                {speaking2026Intro.summary.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[14px] leading-7 text-neutral-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2026 Papers Section */}
      {speaking2026Papers.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-6">
            <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
              Available Papers
            </p>
            <h2 className="mt-2 font-serif text-[32px] text-neutral-950">
              已收錄題目
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {speaking2026Papers.map((paper) => (
              <div
                key={paper.id}
                className="rounded-[24px] border border-neutral-200/80 bg-white p-6 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.15)] transition-shadow hover:shadow-[0_16px_50px_-20px_rgba(15,23,42,0.2)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-600">
                    Paper {paper.paperNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      paper.status === "complete"
                        ? "bg-emerald-50 text-emerald-600"
                        : paper.status === "partial"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {paper.status === "complete"
                      ? "完整"
                      : paper.status === "partial"
                        ? "部分"
                        : "待補"}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-[22px] leading-tight text-neutral-950">
                  {paper.topic}
                </h3>

                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-2 text-[12px] font-medium text-neutral-500">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Discussion Points
                  </p>
                  <ul className="space-y-2">
                    {paper.partADiscussionPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-[#f8f7f3] px-4 py-3 text-[14px] leading-relaxed text-neutral-700"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {paper.partBQuestions && paper.partBQuestions.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-[12px] font-medium text-neutral-500">
                      Part B Questions
                    </p>
                    <ul className="space-y-2">
                      {paper.partBQuestions.map((q, idx) => (
                        <li
                          key={idx}
                          className="rounded-xl bg-blue-50/60 px-4 py-3 text-[14px] leading-relaxed text-neutral-700"
                        >
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-neutral-200/80 bg-white p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.24)] sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <FileText className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                  Direct display
                </p>
                <h2 className="mt-1 font-serif text-[30px] text-neutral-950">
                  這頁會直接展示什麼
                </h2>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {speaking2026Slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-[24px] border border-neutral-200 bg-[#faf9f5] p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                    {slot.label}
                  </p>
                  <h3 className="mt-3 font-serif text-[24px] leading-tight text-neutral-950">
                    {slot.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-7 text-neutral-600">
                    {slot.note}
                  </p>
                  <div className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] text-neutral-500">
                    待補內容
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-neutral-200/80 bg-white p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                  <Clock3 className="h-5 w-5 text-neutral-700" />
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                    Update flow
                  </p>
                  <h2 className="mt-1 font-serif text-[28px] text-neutral-950">
                    你一給 PDF，我就這樣補
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {speaking2026UpdatePlan.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-2xl border border-neutral-200 bg-[#faf9f5] p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-[14px] leading-7 text-neutral-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-neutral-200/80 bg-[#111111] p-6 text-white shadow-[0_24px_90px_-56px_rgba(15,23,42,0.4)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <NotebookTabs className="h-5 w-5 text-neutral-200" />
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">
                    Note
                  </p>
                  <h2 className="mt-1 font-serif text-[28px] text-white">
                    先求快、準、清楚
                  </h2>
                </div>
              </div>

              <p className="mt-6 text-[15px] leading-8 text-neutral-300">
                這頁不會做成花哨的資訊牆，也不會塞一堆分析。第一優先永遠是原始 PDF、題目原文、最少量但最容易理解的整理。
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  disabled
                  variant="outline"
                  className="h-11 rounded-full border-white/15 bg-white/5 px-5 text-white disabled:opacity-100"
                >
                  等你提供 PDF
                </Button>
                <Link href="/papers">
                  <Button className="h-11 rounded-full bg-white px-5 text-neutral-900 hover:bg-neutral-100">
                    回到真題庫
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
