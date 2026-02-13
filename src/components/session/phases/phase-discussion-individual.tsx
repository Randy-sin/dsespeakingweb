"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { LiveKitSession } from "@/components/livekit/livekit-session";
import { MarkerQuestionSelector } from "@/components/session/marker-question-selector";
import { MarkerScoringPanel } from "@/components/session/marker-scoring-panel";
import { TimerDisplay } from "@/components/session/timer-display";
import type { Room, PastPaper } from "@/lib/supabase/types";
import type { DisplayParticipant, MemberWithProfile, PartBQuestion } from "@/components/session/session-types";

interface PhaseDiscussionIndividualProps {
  roomId: string;
  room: Room;
  paper: PastPaper;
  participants: MemberWithProfile[];
  spectators: MemberWithProfile[];
  departedMembers: MemberWithProfile[];
  effectiveDisplayParticipants: DisplayParticipant[];
  currentSpeakerIndex: number;
  currentSpeaker?: MemberWithProfile;
  rawPartBQuestions: PartBQuestion[];
  displayQuestion: PartBQuestion | null;
  discussionPoints: string[];
  timerLabel: string;
  isSpectator: boolean;
  isMarker: boolean;
  hasMarker: boolean;
  isWaitingForMics: boolean;
  isSidePanelCollapsed: boolean;
  canVoteSkip: boolean;
  myVoteSkip: boolean;
  validSkipVotes: number;
  userId?: string;
  onToggleSidePanel: () => void;
  onToggleSkipVote: () => void;
  onAllMicsReady: () => void;
  onImageClick: (url: string) => void;
}

export function PhaseDiscussionIndividual({
  roomId,
  room,
  paper,
  participants,
  spectators,
  departedMembers,
  effectiveDisplayParticipants,
  currentSpeakerIndex,
  currentSpeaker,
  rawPartBQuestions,
  displayQuestion,
  discussionPoints,
  timerLabel,
  isSpectator,
  isMarker,
  hasMarker,
  isWaitingForMics,
  isSidePanelCollapsed,
  canVoteSkip,
  myVoteSkip,
  validSkipVotes,
  userId,
  onToggleSidePanel,
  onToggleSkipVote,
  onAllMicsReady,
  onImageClick,
}: PhaseDiscussionIndividualProps) {
  const statusLabel = room.status === "discussing" ? "Discussion" : "Individual Response";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.9fr)] gap-4">
      <section className="rounded-2xl border border-neutral-200/70 bg-white p-4 min-h-[74vh] flex flex-col">
        <p className="text-[12px] text-neutral-400 uppercase tracking-wide mb-3">
          Audio / Video
        </p>
        <div className="flex-1 min-h-[620px] rounded-xl border border-neutral-200/70 bg-neutral-950 p-2">
          <LiveKitSession
            roomId={roomId}
            roomStatus={room.status}
            currentSpeakerUserId={currentSpeaker?.user_id}
            isSpectator={isSpectator}
            isMarker={isMarker}
            waitingForMics={isWaitingForMics}
            expectedParticipantCount={participants.length}
            onAllMicsReady={onAllMicsReady}
            layoutMode="immersive"
          />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-neutral-400">{paper.year} · {paper.paper_number}</p>
              <p className="text-[14px] font-medium text-neutral-900">{statusLabel}</p>
            </div>
            <TimerDisplay targetDate={room.current_phase_end_at} label={timerLabel} />
          </div>
          <div className="mt-3 space-y-2">
            {discussionPoints.slice(0, 3).map((point, idx) => (
              <div key={idx} className="text-[12px] text-neutral-700 border border-neutral-200/70 rounded-lg px-2.5 py-2">
                T{idx + 1}: {point}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
          <p className="text-[12px] text-neutral-400 uppercase tracking-wide mb-3">
            Marker / 觀眾 / 參與者
          </p>
          <div className="space-y-2">
            {effectiveDisplayParticipants.map((member, idx) => {
              const isSpeaking = room.status === "individual" && idx === currentSpeakerIndex;
              const hasLeft = member.hasLeft;
              return (
                <div
                  key={member.user_id}
                  className={`flex items-center gap-2.5 rounded-lg border p-2 ${
                    hasLeft
                      ? "border-red-100 bg-red-50/40 opacity-70"
                      : isSpeaking
                        ? "border-neutral-300 bg-neutral-50"
                        : "border-neutral-200/70 bg-white"
                  }`}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className={`text-[10px] ${
                        hasLeft ? "bg-neutral-200 text-neutral-400" : "bg-neutral-900 text-white"
                      }`}
                    >
                      {member.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] truncate ${hasLeft ? "line-through text-neutral-400" : "text-neutral-800"}`}>
                      {member.profiles?.display_name || "匿名"}
                    </p>
                  </div>
                  {hasLeft ? (
                    <span className="text-[10px] text-red-400">已退出</span>
                  ) : isSpeaking ? (
                    <Badge variant="outline" className="text-[10px]">speaking</Badge>
                  ) : null}
                </div>
              );
            })}
          </div>
          {(spectators.length > 0 || departedMembers.some((d) => d.role === "spectator")) && (
            <div className="mt-3 rounded-lg border border-neutral-200/70 p-2.5">
              <p className="text-[11px] text-neutral-400 mb-1">Spectators ({spectators.length})</p>
              <div className="space-y-1">
                {spectators.map((spec) => (
                  <p key={spec.user_id} className="text-[12px] text-neutral-600 truncate">
                    {spec.profiles?.display_name || "匿名"}
                  </p>
                ))}
              </div>
            </div>
          )}
          {canVoteSkip && (
            <div className="mt-3 rounded-lg border border-neutral-200/70 p-2.5">
              <p className="text-[11px] text-neutral-400 mb-1.5">Skip Vote</p>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${(validSkipVotes / Math.max(1, participants.length)) * 100}%` }}
                />
              </div>
              <Button variant="outline" size="sm" className="w-full text-[12px]" onClick={onToggleSkipVote}>
                {myVoteSkip ? "已投票跳過" : "投票跳過本階段"}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-neutral-400 uppercase tracking-wide">
              {room.status === "discussing" ? "Article / PDF" : "Part B Focus"}
            </p>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onToggleSidePanel}>
              {isSidePanelCollapsed ? (
                <>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  展开
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  收起
                </>
              )}
            </Button>
          </div>

          {!isSidePanelCollapsed && room.status === "discussing" && (
            <div className="space-y-2">
              {paper.page_images &&
              Array.isArray(paper.page_images) &&
              paper.page_images.length > 0 ? (
                paper.page_images.slice(0, 1).map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onImageClick(url)}
                    className="block w-full rounded overflow-hidden border border-neutral-200/70"
                  >
                    <img
                      src={url}
                      alt={`PDF ${idx + 1}`}
                      className="w-full h-auto object-contain max-h-[42vh] cursor-zoom-in"
                    />
                  </button>
                ))
              ) : (
                <div className="space-y-2">
                  {paper.part_a_article?.slice(0, 2).map((paragraph: string, idx: number) => (
                    <p key={idx} className="text-[13px] text-neutral-600 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isSidePanelCollapsed && room.status === "individual" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-neutral-200/70 p-2.5">
                <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">
                  發言順序
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveDisplayParticipants.map((m, idx) => {
                    const isActive = idx === currentSpeakerIndex;
                    const isDone = idx < currentSpeakerIndex;
                    return (
                      <span
                        key={m.user_id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${
                          m.hasLeft
                            ? "bg-red-50 text-red-400 line-through"
                            : isActive
                              ? "bg-neutral-900 text-white"
                              : isDone
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {m.hasLeft && <UserX className="h-3 w-3" />}
                        {!m.hasLeft && isActive && <Mic className="h-3 w-3" />}
                        {m.profiles?.display_name?.split(" ")[0] || `#${idx + 1}`}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200/70 p-2.5">
                <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">
                  當前題目
                </p>
                {displayQuestion ? (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-[10px]">
                      Q{displayQuestion.number ?? currentSpeakerIndex + 1}
                    </Badge>
                    <p className="text-[14px] text-neutral-800 leading-relaxed font-medium">
                      {displayQuestion.text ?? displayQuestion.question ?? ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] text-neutral-500">
                    {hasMarker ? "等待 Marker 选择题目..." : "题目载入中..."}
                  </p>
                )}
              </div>

              {isMarker && (
                <MarkerQuestionSelector
                  room={room}
                  roomId={roomId}
                  participants={participants}
                  questions={rawPartBQuestions}
                  currentSpeakerIndex={currentSpeakerIndex}
                />
              )}
            </div>
          )}
        </div>

        {isMarker && userId && (
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
            <MarkerScoringPanel roomId={roomId} markerId={userId} participants={participants} />
          </div>
        )}
      </aside>
    </div>
  );
}
