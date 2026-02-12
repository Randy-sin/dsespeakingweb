"use client";

import Link from "next/link";
import { Eye, ClipboardCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PhaseIndicator } from "@/components/session/phase-indicator";
import { TimerDisplay } from "@/components/session/timer-display";
import type { RoomStatus } from "@/lib/supabase/types";

interface SessionTopBarProps {
  roomStatus: RoomStatus;
  isSpectator: boolean;
  isMarker: boolean;
  timerTargetDate: string | null;
  timerLabel: string;
}

export function SessionTopBar({
  roomStatus,
  isSpectator,
  isMarker,
  timerTargetDate,
  timerLabel,
}: SessionTopBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-serif text-[15px] font-semibold text-neutral-900 tracking-tight"
          >
            DSE
          </Link>
          <Separator orientation="vertical" className="h-5 bg-neutral-200" />
          <PhaseIndicator currentPhase={roomStatus} />
        </div>
        <div className="flex items-center gap-3">
          {isSpectator && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              <Eye className="h-3 w-3" />
              觀眾模式
            </span>
          )}
          {isMarker && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
              <ClipboardCheck className="h-3 w-3" />
              Marker
            </span>
          )}
          <TimerDisplay targetDate={timerTargetDate} label={timerLabel} />
        </div>
      </div>
    </div>
  );
}
