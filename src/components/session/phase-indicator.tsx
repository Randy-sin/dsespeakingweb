"use client";

import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/supabase/types";

interface PhaseIndicatorProps {
  currentPhase: RoomStatus;
}

const phases = [
  { key: "preparing", label: "Prep" },
  { key: "discussing", label: "Discussion" },
  { key: "individual", label: "Individual" },
  { key: "finished", label: "Done" },
] as const;

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = phases.findIndex((p) => p.key === currentPhase);

  return (
    <div className="flex items-center gap-1">
      {phases.map((phase, idx) => {
        const isActive = phase.key === currentPhase;
        const isDone = idx < currentIndex;

        return (
          <div key={phase.key} className="flex items-center">
            <div
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-all tracking-wide",
                isActive
                  ? "bg-neutral-900 text-white"
                  : isDone
                    ? "bg-neutral-100 text-neutral-500"
                    : "text-neutral-300"
              )}
            >
              {phase.label}
            </div>
            {idx < phases.length - 1 && (
              <div
                className={cn(
                  "w-3 sm:w-5 h-px mx-0.5",
                  idx < currentIndex ? "bg-neutral-300" : "bg-neutral-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
