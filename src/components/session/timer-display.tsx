"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  targetDate: string | null;
  label: string;
  className?: string;
}

export function TimerDisplay({
  targetDate,
  label,
  className,
}: TimerDisplayProps) {
  const { formatted, timeLeft } = useCountdown(targetDate);
  const isUrgent = timeLeft > 0 && timeLeft <= 60;
  const isWarning = timeLeft > 60 && timeLeft <= 120;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors",
        isUrgent
          ? "border-neutral-400 bg-neutral-50"
          : isWarning
            ? "border-neutral-300 bg-neutral-50/50"
            : "border-neutral-200 bg-white",
        className
      )}
    >
      <span className="text-[11px] text-neutral-400 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-[22px] font-mono font-semibold tabular-nums text-neutral-900",
          isUrgent && "animate-pulse"
        )}
      >
        {targetDate ? formatted : "--:--"}
      </span>
    </div>
  );
}
