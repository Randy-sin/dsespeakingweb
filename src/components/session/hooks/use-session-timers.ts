"use client";

import { useCountdown } from "@/hooks/use-countdown";
import type { Room } from "@/lib/supabase/types";
import type { PartBSubphase } from "@/components/session/session-types";

const DISCUSSION_DURATION = 8 * 60;

interface UseSessionTimersParams {
  room: Room | null;
  currentSpeakerIndex: number;
  participantsLength: number;
}

export function useSessionTimers({
  room,
  currentSpeakerIndex,
  participantsLength,
}: UseSessionTimersParams) {
  const { timeLeft, isExpired } = useCountdown(room?.current_phase_end_at ?? null);
  const { timeLeft: partBCountdownLeft, isExpired: isPartBCountdownExpired } =
    useCountdown(room?.part_b_countdown_end_at ?? null);

  const isWaitingForMics =
    room?.status === "discussing" && !room?.current_phase_end_at;

  const countdownNumber =
    room?.status === "discussing" &&
    room?.current_phase_end_at &&
    timeLeft > DISCUSSION_DURATION
      ? Math.ceil(timeLeft - DISCUSSION_DURATION)
      : null;

  const partBSubphase = (room?.part_b_subphase as PartBSubphase | null) ?? null;
  const partBCountdownNumber =
    room?.status === "individual" &&
    partBSubphase === "countdown" &&
    room?.part_b_countdown_end_at
      ? Math.max(1, Math.ceil(partBCountdownLeft))
      : null;

  const timerLabel = isWaitingForMics
    ? "Mic Check"
    : room?.status === "preparing"
      ? "Prep"
      : room?.status === "discussing"
        ? "Discussion"
        : room?.status === "individual"
          ? `Individual ${currentSpeakerIndex + 1}/${participantsLength}`
          : room?.status === "results"
            ? "Results"
            : room?.status === "free_discussion"
              ? "Free Talk"
              : "Done";

  return {
    timeLeft,
    isExpired,
    partBCountdownLeft,
    isPartBCountdownExpired,
    isWaitingForMics,
    countdownNumber,
    partBSubphase,
    partBCountdownNumber,
    timerLabel,
  };
}
