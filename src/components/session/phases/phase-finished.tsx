"use client";

import Link from "next/link";
import { Home, MessageSquareText, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkerScoringPanel } from "@/components/session/marker-scoring-panel";
import type { MemberWithProfile } from "@/components/session/session-types";
import type { PastPaper } from "@/lib/supabase/types";

interface PhaseFinishedProps {
  roomId: string;
  participants: MemberWithProfile[];
  isMarker: boolean;
  isSpectator: boolean;
  userId?: string;
  paper: Pick<PastPaper, "id" | "paper_id" | "topic" | "paper_number" | "year">;
}

export function PhaseFinished({
  roomId,
  participants,
  isMarker,
  isSpectator,
  userId,
  paper,
}: PhaseFinishedProps) {
  return (
    <div className="text-center py-20">
      <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-4">
        Session Complete
      </p>
      <h2 className="font-serif text-[32px] font-semibold text-neutral-900 tracking-tight mb-3">
        練習完成
      </h2>
      <p className="text-[15px] text-neutral-400 mb-10 max-w-md mx-auto">
        {isMarker
          ? "練習已結束。你可以在下方完成評分。"
          : isSpectator
            ? "你觀看的 DSE Speaking 模擬練習已經結束。"
            : "你完成了一次完整的 DSE Speaking 模擬練習。回顧討論中的表現，持續進步。"}
      </p>

      {isMarker && userId && (
        <div className="max-w-lg mx-auto mb-10">
          <MarkerScoringPanel roomId={roomId} markerId={userId} participants={participants} />
        </div>
      )}

      <div className="max-w-2xl mx-auto rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 mb-8 text-left">
        <p className="text-[12px] text-neutral-400 uppercase tracking-[0.18em] mb-2">
          Next move
        </p>
        <p className="text-[14px] text-neutral-600 leading-relaxed">
          這次練的是 {paper.year} · {paper.paper_number} · {paper.topic}。趁記憶還新鮮，最值得做的是去同題討論頁看別人的觀點，或直接發一篇你的模擬復盤。
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={`/papers/${paper.paper_id}`}>
          <Button
            variant="outline"
            className="h-10 px-5 border-neutral-200 text-neutral-600 text-[14px] rounded-full"
          >
            <MessageSquareText className="mr-2 h-4 w-4" />
            看同題討論
          </Button>
        </Link>
        <Link href={`/forum/new?paperId=${paper.id}&postType=mock_review`}>
          <Button className="h-10 px-6 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-full">
            <NotebookPen className="mr-2 h-4 w-4" />
            發模擬復盤
          </Button>
        </Link>
        <Link href="/rooms">
          <Button
            variant="outline"
            className="h-10 px-5 border-neutral-200 text-neutral-600 text-[14px] rounded-full"
          >
            <Home className="mr-2 h-4 w-4" />
            返回房間
          </Button>
        </Link>
      </div>
    </div>
  );
}
