import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { ArrowLeft } from "lucide-react";
import { speaking2026Papers } from "@/lib/papers/speaking-2026";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "2026 DSE Speaking 題目整理",
  description:
    "2026 DSE English Paper 4 口試題目整理，包含 Part A Group Interaction 討論點和 Part B Individual Response 問題。",
  path: "/papers/2026-speaking",
});

export default function Speaking2026Page() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Back */}
        <Link
          href="/papers"
          className="inline-flex items-center gap-2 text-[14px] text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Papers
        </Link>

        {/* Header */}
        <header className="mt-8 mb-12">
          <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold text-neutral-900 tracking-tight">
            2026 DSE Speaking
          </h1>
          <p className="mt-3 text-[16px] text-neutral-500">
            Paper 4 口試題目整理，資料來源：考生分享
          </p>
        </header>

        {/* Papers */}
        <div className="space-y-16">
          {speaking2026Papers.map((paper) => (
            <article key={paper.id} className="border-t border-neutral-200 pt-8">
              {/* Paper Header */}
              <div className="mb-8">
                <p className="text-[13px] text-neutral-400 mb-2">
                  {paper.date} {paper.time} · Paper {paper.paperNumber}
                </p>
                <h2 className="font-serif text-[24px] sm:text-[28px] font-semibold text-neutral-900">
                  {paper.topic}
                </h2>
              </div>

              {/* Part A */}
              <section className="mb-8">
                <h3 className="text-[13px] font-semibold text-neutral-900 uppercase tracking-wide mb-4">
                  Part A · Group Interaction
                </h3>
                <ul className="space-y-2">
                  {paper.partADiscussionPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-[15px] text-neutral-700 leading-relaxed"
                    >
                      <span className="text-neutral-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Part B */}
              <section>
                <h3 className="text-[13px] font-semibold text-neutral-900 uppercase tracking-wide mb-4">
                  Part B · Individual Response
                </h3>
                <ul className="space-y-2">
                  {paper.partBQuestions.map((q, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 text-[15px] text-neutral-700 leading-relaxed"
                    >
                      <span className="text-neutral-400">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-200">
          <p className="text-[14px] text-neutral-400">
            題目持續更新中。如有更多資料歡迎到
            <Link href="/forum" className="text-neutral-600 hover:text-neutral-900 mx-1">
              論壇
            </Link>
            分享。
          </p>
        </footer>
      </main>
    </div>
  );
}
