import Link from "next/link";
import { ArrowUpRight, BookOpenText, MessageSquare, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaperWithForumMeta } from "@/lib/forum/server";

interface PaperCardProps {
  paper: PaperWithForumMeta;
}

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <article className="group rounded-[24px] border border-neutral-200/80 bg-white p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
            {paper.year} · {paper.paper_number}
          </p>
          <h3 className="mt-3 font-serif text-[24px] leading-tight text-neutral-950">
            {paper.topic}
          </h3>
          <p className="mt-3 text-[14px] leading-7 text-neutral-600">
            {paper.part_a_title}
          </p>
        </div>

        <Link href={`/papers/${paper.paper_id}`}>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <BookOpenText className="h-3.5 w-3.5" />
          {paper.page_images?.length ? "掃描圖版" : "文字版"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          {paper.discussionCount} 則討論
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {paper.part_a_discussion_points?.length ?? 0} 個討論點
        </span>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <p className="text-[13px] leading-6 text-neutral-500">
          {paper.part_a_source || "DSE Speaking archive"}
        </p>
      </div>
    </article>
  );
}
