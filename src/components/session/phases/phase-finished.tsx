"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkerScoringPanel } from "@/components/session/marker-scoring-panel";
import type { MemberWithProfile } from "@/components/session/session-types";

interface PhaseFinishedProps {
  roomId: string;
  participants: MemberWithProfile[];
  isMarker: boolean;
  isSpectator: boolean;
  userId?: string;
}

export function PhaseFinished({
  roomId,
  participants,
  isMarker,
  isSpectator,
  userId,
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

      <Link href="/rooms">
        <Button className="h-10 px-6 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-full">
          <Home className="mr-2 h-4 w-4" />
          返回
        </Button>
      </Link>
    </div>
  );
}
