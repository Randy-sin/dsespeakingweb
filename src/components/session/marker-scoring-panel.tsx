"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { Profile, RoomMember } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

// DSE Paper 4 Speaking assessment criteria
const CRITERIA = [
  {
    key: "pronunciation_delivery" as const,
    label: "Pronunciation & Delivery",
    short: "P&D",
    description: "Clarity, intonation, stress, pace, fluency",
  },
  {
    key: "communication_strategies" as const,
    label: "Communication Strategies",
    short: "CS",
    description: "Participation, interactivity, responsiveness",
  },
  {
    key: "vocabulary_language" as const,
    label: "Vocabulary & Language",
    short: "V&L",
    description: "Richness, accuracy, expressive diversity",
  },
  {
    key: "ideas_organisation" as const,
    label: "Ideas & Organisation",
    short: "I&O",
    description: "Content relevance, logic, argument development",
  },
] as const;

type CriterionKey = (typeof CRITERIA)[number]["key"];

const BAND_DESCRIPTORS: Record<number, { label: string; color: string }> = {
  7: { label: "Excellent", color: "bg-emerald-500" },
  6: { label: "Very Good", color: "bg-emerald-400" },
  5: { label: "Good", color: "bg-blue-400" },
  4: { label: "Competent", color: "bg-blue-300" },
  3: { label: "Adequate", color: "bg-amber-400" },
  2: { label: "Limited", color: "bg-orange-400" },
  1: { label: "Very Limited", color: "bg-red-400" },
  0: { label: "N/A", color: "bg-neutral-300" },
};

type ScoreState = {
  pronunciation_delivery: number | null;
  communication_strategies: number | null;
  vocabulary_language: number | null;
  ideas_organisation: number | null;
  comment: string;
};

interface MarkerScoringPanelProps {
  roomId: string;
  markerId: string;
  participants: MemberWithProfile[];
}

export function MarkerScoringPanel({
  roomId,
  markerId,
  participants,
}: MarkerScoringPanelProps) {
  const supabase = createClient();
  const [selectedCandidate, setSelectedCandidate] = useState<string>(
    participants[0]?.user_id ?? ""
  );
  const [scores, setScores] = useState<Record<string, ScoreState>>({});
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing scores
  useEffect(() => {
    const loadScores = async () => {
      const { data } = await supabase
        .from("marker_scores")
        .select("*")
        .eq("room_id", roomId)
        .eq("marker_id", markerId);

      if (data) {
        const loaded: Record<string, ScoreState> = {};
        for (const row of data) {
          loaded[row.candidate_id] = {
            pronunciation_delivery: row.pronunciation_delivery,
            communication_strategies: row.communication_strategies,
            vocabulary_language: row.vocabulary_language,
            ideas_organisation: row.ideas_organisation,
            comment: row.comment ?? "",
          };
        }
        setScores(loaded);
      }
    };
    loadScores();
  }, [roomId, markerId, supabase]);

  // Debounced save
  const saveScore = useCallback(
    async (candidateId: string, state: ScoreState) => {
      setSaving(true);
      const { error } = await supabase
        .from("marker_scores")
        .upsert(
          {
            room_id: roomId,
            marker_id: markerId,
            candidate_id: candidateId,
            ...state,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "room_id,marker_id,candidate_id" }
        );

      if (error) {
        console.error("Save score error:", error);
        toast.error("評分儲存失敗");
      }
      setSaving(false);
    },
    [roomId, markerId, supabase]
  );

  const updateScore = (
    candidateId: string,
    key: CriterionKey | "comment",
    value: number | string
  ) => {
    const current = scores[candidateId] ?? {
      pronunciation_delivery: null,
      communication_strategies: null,
      vocabulary_language: null,
      ideas_organisation: null,
      comment: "",
    };
    const updated = { ...current, [key]: value };
    setScores((prev) => ({ ...prev, [candidateId]: updated }));

    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveScore(candidateId, updated);
    }, 800);
  };

  const currentScores = scores[selectedCandidate] ?? {
    pronunciation_delivery: null,
    communication_strategies: null,
    vocabulary_language: null,
    ideas_organisation: null,
    comment: "",
  };

  const getTotal = (s: ScoreState) => {
    const vals = [
      s.pronunciation_delivery,
      s.communication_strategies,
      s.vocabulary_language,
      s.ideas_organisation,
    ].filter((v) => v !== null) as number[];
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-neutral-400 uppercase tracking-wide">
          Scoring Panel
        </p>
        {saving && (
          <span className="text-[11px] text-neutral-400 animate-pulse">
            saving...
          </span>
        )}
      </div>

      {/* Candidate tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {participants.map((p) => {
          const isActive = selectedCandidate === p.user_id;
          const s = scores[p.user_id];
          const total = s ? getTotal(s) : null;
          return (
            <button
              key={p.user_id}
              type="button"
              onClick={() => setSelectedCandidate(p.user_id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                isActive
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-neutral-200/60 bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback
                  className={`text-[8px] ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {p.profiles?.display_name?.slice(0, 1)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">
                {p.profiles?.display_name?.split(" ")[0] || "Candidate"}
              </span>
              {total !== null && (
                <span className="text-[10px] font-mono opacity-70">
                  {total}/28
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Score card for selected candidate */}
      <div className="border border-neutral-200/60 rounded-xl p-4 space-y-3">
        {/* Candidate header */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px] bg-violet-600 text-white font-medium">
              {participants
                .find((p) => p.user_id === selectedCandidate)
                ?.profiles?.display_name?.slice(0, 2)
                ?.toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-neutral-900 truncate">
              {participants.find((p) => p.user_id === selectedCandidate)
                ?.profiles?.display_name || "Candidate"}
            </p>
          </div>
          {getTotal(currentScores) !== null && (
            <Badge
              variant="outline"
              className="text-[11px] font-mono text-violet-600 border-violet-200"
            >
              {getTotal(currentScores)}/28
            </Badge>
          )}
        </div>

        <Separator className="bg-neutral-100" />

        {/* 4 criteria */}
        {CRITERIA.map((criterion) => {
          const value = currentScores[criterion.key];
          return (
            <div key={criterion.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-neutral-700">
                    {criterion.label}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {criterion.description}
                  </p>
                </div>
                {value !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-neutral-900 font-mono">
                      {value}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {BAND_DESCRIPTORS[value]?.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Score buttons 0-7 */}
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => {
                  const isSelected = value === n;
                  const band = BAND_DESCRIPTORS[n];
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        updateScore(selectedCandidate, criterion.key, n)
                      }
                      title={`${n} — ${band.label}`}
                      className={`flex-1 h-8 rounded text-[12px] font-mono font-semibold transition-all ${
                        isSelected
                          ? `${band.color} text-white shadow-sm`
                          : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Separator className="bg-neutral-100" />

        {/* Comment */}
        <div>
          <p className="text-[11px] text-neutral-400 mb-1.5">Comment</p>
          <Textarea
            value={currentScores.comment}
            onChange={(e) =>
              updateScore(selectedCandidate, "comment", e.target.value)
            }
            placeholder="Optional feedback for this candidate..."
            className="min-h-[60px] resize-y text-[12px] border-neutral-200 focus-visible:ring-violet-300"
          />
        </div>
      </div>

      {/* Summary overview */}
      <div className="border border-neutral-200/60 rounded-lg p-3">
        <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">
          Overview
        </p>
        <div className="space-y-1.5">
          {participants.map((p) => {
            const s = scores[p.user_id];
            const total = s ? getTotal(s) : null;
            const scored = s
              ? [
                  s.pronunciation_delivery,
                  s.communication_strategies,
                  s.vocabulary_language,
                  s.ideas_organisation,
                ].filter((v) => v !== null).length
              : 0;
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-2 text-[12px]"
              >
                <span className="w-20 truncate text-neutral-600 font-medium">
                  {p.profiles?.display_name?.split(" ")[0] || "?"}
                </span>
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full transition-all duration-300"
                    style={{
                      width: total !== null ? `${(total / 28) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="font-mono text-neutral-400 w-12 text-right">
                  {total !== null ? `${total}/28` : `${scored}/4`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
