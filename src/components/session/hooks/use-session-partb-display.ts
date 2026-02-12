"use client";

import { useMemo } from "react";
import type { Room, PastPaper } from "@/lib/supabase/types";
import type { MemberWithProfile, PartBQuestion } from "@/components/session/session-types";

function assignQuestions(
  questions: PartBQuestion[],
  participantCount: number
): PartBQuestion[] {
  if (!questions.length || !participantCount) return [];
  const step = Math.max(1, Math.floor(questions.length / participantCount));
  return Array.from({ length: participantCount }, (_, i) => {
    const idx = Math.min(i * step, questions.length - 1);
    return questions[idx];
  });
}

interface UseSessionPartBDisplayParams {
  room: Room;
  paper: PastPaper;
  participants: MemberWithProfile[];
  currentSpeakerIndex: number;
  hasMarker: boolean;
  partBSubphase: "selecting" | "countdown" | "answering" | null;
}

export function useSessionPartBDisplay({
  room,
  paper,
  participants,
  currentSpeakerIndex,
  hasMarker,
  partBSubphase,
}: UseSessionPartBDisplayParams) {
  const rawPartBQuestions = useMemo(
    () => ((paper.part_b_questions as PartBQuestion[]) || []),
    [paper.part_b_questions]
  );
  const assignedQuestions = useMemo(
    () => assignQuestions(rawPartBQuestions, participants.length),
    [rawPartBQuestions, participants.length]
  );

  const markerQuestions = (room.marker_questions ?? {}) as Record<string, number>;
  const markerSelectedQIdx = markerQuestions[String(currentSpeakerIndex)];
  const markerSelectedQuestion =
    hasMarker && markerSelectedQIdx !== undefined && markerSelectedQIdx !== null
      ? rawPartBQuestions[markerSelectedQIdx]
      : null;

  const displayQuestion =
    room.status === "individual" &&
    (partBSubphase === "answering" || !hasMarker)
      ? hasMarker
        ? markerSelectedQuestion
        : assignedQuestions[currentSpeakerIndex] ?? null
      : null;

  return {
    rawPartBQuestions,
    assignedQuestions,
    markerQuestions,
    markerSelectedQIdx,
    markerSelectedQuestion,
    displayQuestion,
  };
}
