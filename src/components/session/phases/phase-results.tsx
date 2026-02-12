"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserX } from "lucide-react";
import { MarkerScoringPanel } from "@/components/session/marker-scoring-panel";
import type { MarkerScore } from "@/lib/supabase/types";
import type { DisplayParticipant, MemberWithProfile } from "@/components/session/session-types";

interface PhaseResultsProps {
  roomId: string;
  markerScores: MarkerScore[];
  effectiveDisplayParticipants: DisplayParticipant[];
  participants: MemberWithProfile[];
  isMarker: boolean;
  isSpectator: boolean;
  userId?: string;
  onStartFreeDiscussion: () => void;
  onFinishSession: () => void;
}

export function PhaseResults({
  roomId,
  markerScores,
  effectiveDisplayParticipants,
  participants,
  isMarker,
  isSpectator,
  userId,
  onStartFreeDiscussion,
  onFinishSession,
}: PhaseResultsProps) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-2">
          Results
        </p>
        <h2 className="font-serif text-[30px] font-semibold text-neutral-900 tracking-tight">
          Marker Feedback
        </h2>
        <p className="text-[14px] text-neutral-500 mt-2">
          所有人均可查看評分與評語。Marker 現在可以開麥給口頭建議。
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {effectiveDisplayParticipants.map((candidate) => {
            const score = markerScores.find((s) => s.candidate_id === candidate.user_id);
            const total =
              (score?.pronunciation_delivery ?? 0) +
              (score?.communication_strategies ?? 0) +
              (score?.vocabulary_language ?? 0) +
              (score?.ideas_organisation ?? 0);
            const hasLeft = candidate.hasLeft;

            return (
              <div
                key={candidate.user_id}
                className={`rounded-xl border p-4 ${hasLeft ? "border-red-100 bg-red-50/20 opacity-70" : "border-neutral-200/70 bg-white"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-[10px] ${hasLeft ? "bg-neutral-200 text-neutral-400" : "bg-neutral-900 text-white"}`}>
                        {candidate.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] font-medium ${hasLeft ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                        {candidate.profiles?.display_name || "Candidate"}
                      </p>
                      {hasLeft && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">
                          <UserX className="h-2.5 w-2.5" />
                          已退出
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {score ? `${total}/28` : "Pending"}
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-neutral-600">
                  <div>Pronunciation: {score?.pronunciation_delivery ?? "-"}</div>
                  <div>Communication: {score?.communication_strategies ?? "-"}</div>
                  <div>Vocabulary: {score?.vocabulary_language ?? "-"}</div>
                  <div>Ideas: {score?.ideas_organisation ?? "-"}</div>
                </div>
                <p className="mt-3 text-[13px] text-neutral-500 leading-relaxed">
                  {score?.comment || "No comment yet."}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {isMarker && userId && (
            <MarkerScoringPanel roomId={roomId} markerId={userId} participants={participants} />
          )}
          <div className="rounded-xl border border-neutral-200/70 p-4 space-y-2">
            <p className="text-[12px] text-neutral-400 uppercase tracking-wide">
              Next Step
            </p>
            <Button className="w-full" onClick={onStartFreeDiscussion} disabled={isSpectator}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Free Discussion
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onFinishSession}
              disabled={isSpectator}
            >
              End Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
