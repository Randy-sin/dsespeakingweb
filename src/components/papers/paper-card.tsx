import Link from "next/link";
import { ArrowDownRight, BookOpenText, CalendarDays } from "lucide-react";
import type { PaperWithForumMeta } from "@/lib/forum/server";

interface PaperCardProps {
  paper: PaperWithForumMeta;
}

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <article className="group flex min-h-72 flex-col border border-[#bdb3a2] bg-[#faf7ef] p-6 transition-colors hover:bg-[#eee7da] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#ad3f29]">
            {paper.year} · {paper.paper_number}
          </p>
          <h3 className="mt-4 font-serif text-[30px] leading-tight tracking-[-0.03em]">
            {paper.topic}
          </h3>
          <p className="mt-3 text-[14px] leading-7 text-[#6d695f]">
            {paper.part_a_title}
          </p>
        </div>

        <ArrowDownRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] text-[#6d695f]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7cebd] px-3 py-1.5">
          <BookOpenText className="h-3.5 w-3.5" />
          {paper.page_images?.length ? "掃描圖版" : "文字版"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7cebd] px-3 py-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {paper.part_a_discussion_points?.length ?? 0} 個討論點
        </span>
      </div>

      <Link href={`/papers/${paper.paper_id}`} className="mt-auto flex items-center justify-between border-t border-[#bdb3a2] pt-4 text-sm font-semibold"><span>開啟題目與練習</span><span className="font-mono text-[10px] text-[#665f55]">{paper.discussionCount} NOTES</span></Link>
    </article>
  );
}
