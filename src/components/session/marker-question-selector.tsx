"use client";

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, ArrowRight, Mic } from "lucide-react";
import { toast } from "sonner";
import type { Room, Profile, RoomMember, Json } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

type PartBQuestion = {
  text?: string;
  question?: string;
  number?: number;
  difficulty?: string;
  difficulty_level?: string;
};

interface MarkerQuestionSelectorProps {
  room: Room;
  roomId: string;
  participants: MemberWithProfile[];
  questions: PartBQuestion[];
  currentSpeakerIndex: number;
}

export function MarkerQuestionSelector({
  room,
  roomId,
  participants,
  questions,
  currentSpeakerIndex,
}: MarkerQuestionSelectorProps) {
  const supabase = createClient();
  const currentSpeaker = participants[currentSpeakerIndex];
  const markerQuestions = (room.marker_questions ?? {}) as Record<string, number>;
  const selectedQIdx = markerQuestions[String(currentSpeakerIndex)];
  const hasSelected = selectedQIdx !== undefined && selectedQIdx !== null;

  // Questions already used by other speakers
  const usedQuestionIndices = new Set(
    Object.entries(markerQuestions)
      .filter(([k]) => k !== String(currentSpeakerIndex))
      .map(([, v]) => v)
  );

  const handleSelectQuestion = async (questionIndex: number) => {
    const newMarkerQuestions = {
      ...markerQuestions,
      [String(currentSpeakerIndex)]: questionIndex,
    };

    const { error } = await supabase
      .from("rooms")
      .update({ marker_questions: newMarkerQuestions as unknown as Json })
      .eq("id", roomId);

    if (error) {
      console.error("Select question error:", error);
      toast.error("选择问题失败");
    }
  };

  const handleNextSpeaker = async () => {
    const nextIndex = currentSpeakerIndex + 1;
    if (nextIndex < participants.length) {
      const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
      await supabase
        .from("rooms")
        .update({
          current_phase_end_at: phaseEnd,
          current_speaker_index: nextIndex,
          skip_votes: [],
        })
        .eq("id", roomId);
    } else {
      await supabase
        .from("rooms")
        .update({
          status: "finished",
          current_phase_end_at: null,
          current_speaker_index: null,
          skip_votes: [],
        })
        .eq("id", roomId);
      toast("练习完成");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-neutral-400 uppercase tracking-wide">
        Question Selection
      </p>

      {/* Current speaker info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50 border border-violet-200/60">
        <Avatar className="h-8 w-8 ring-2 ring-violet-500 ring-offset-1">
          <AvatarFallback className="bg-violet-600 text-white text-[10px] font-semibold">
            {currentSpeaker?.profiles?.display_name
              ?.slice(0, 2)
              ?.toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-neutral-900 truncate">
            {currentSpeaker?.profiles?.display_name || "Speaker"}
          </p>
          <p className="text-[11px] text-violet-500">
            Candidate {currentSpeakerIndex + 1} of {participants.length}
          </p>
        </div>
        <Mic className="h-4 w-4 text-violet-400 animate-pulse" />
      </div>

      {/* Question pool */}
      <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
        {questions.map((q, idx) => {
          const qText = q.text ?? q.question ?? "";
          const isUsed = usedQuestionIndices.has(idx);
          const isSelected = selectedQIdx === idx;
          const difficulty = q.difficulty;

          return (
            <button
              key={idx}
              type="button"
              disabled={isUsed}
              onClick={() => handleSelectQuestion(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? "border-violet-300 bg-violet-50 ring-1 ring-violet-200"
                  : isUsed
                  ? "border-neutral-100 bg-neutral-50/50 opacity-50 cursor-not-allowed"
                  : "border-neutral-200/60 bg-white hover:border-violet-200 hover:bg-violet-50/30 cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded text-[10px] font-bold font-mono ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : isUsed
                      ? "bg-neutral-200 text-neutral-400"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {q.number ?? idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] leading-relaxed ${
                      isSelected
                        ? "text-violet-900 font-medium"
                        : isUsed
                        ? "text-neutral-400"
                        : "text-neutral-700"
                    }`}
                  >
                    {qText}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {difficulty && (
                      <span
                        className={`text-[10px] ${
                          difficulty === "hard"
                            ? "text-red-400"
                            : difficulty === "medium"
                            ? "text-amber-400"
                            : "text-green-400"
                        }`}
                      >
                        {difficulty}
                      </span>
                    )}
                    {isUsed && (
                      <span className="text-[10px] text-neutral-400">
                        already used
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Next speaker button */}
      <Button
        onClick={handleNextSpeaker}
        className="w-full h-9 text-[13px] bg-violet-600 hover:bg-violet-700 text-white"
      >
        {currentSpeakerIndex + 1 < participants.length ? (
          <>
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
            Next Speaker
          </>
        ) : (
          "Finish Session"
        )}
      </Button>
    </div>
  );
}
