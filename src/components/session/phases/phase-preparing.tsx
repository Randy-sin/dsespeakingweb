"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LiveKitSession } from "@/components/livekit/livekit-session";
import { ArrowRight, Check, Circle, ClipboardCheck, Eye, UserX } from "lucide-react";
import type { Room, PastPaper } from "@/lib/supabase/types";
import type { DisplayParticipant, MemberWithProfile } from "@/components/session/session-types";

interface PhasePreparingProps {
  roomId: string;
  room: Room;
  paper: PastPaper;
  notes: string;
  onNotesChange: (value: string) => void;
  currentSpeakerUserId?: string;
  participants: MemberWithProfile[];
  spectators: MemberWithProfile[];
  markerMember?: MemberWithProfile;
  departedMembers: MemberWithProfile[];
  departedParticipants: MemberWithProfile[];
  effectiveDisplayParticipants: DisplayParticipant[];
  currentSpeakerIndex: number;
  isSpectator: boolean;
  isMarker: boolean;
  isObserver: boolean;
  hasMarker: boolean;
  isWaitingForMics: boolean;
  canVoteSkip: boolean;
  validSkipVotes: number;
  myVoteSkip: boolean;
  allVotedSkip: boolean;
  userId?: string;
  onAllMicsReady: () => void;
  onToggleSkipVote: () => void;
  onImageClick: (url: string) => void;
}

export function PhasePreparing({
  roomId,
  room,
  paper,
  notes,
  onNotesChange,
  currentSpeakerUserId,
  participants,
  spectators,
  markerMember,
  departedMembers,
  departedParticipants,
  effectiveDisplayParticipants,
  currentSpeakerIndex,
  isSpectator,
  isMarker,
  isObserver,
  hasMarker,
  isWaitingForMics,
  canVoteSkip,
  validSkipVotes,
  myVoteSkip,
  allVotedSkip,
  userId,
  onAllMicsReady,
  onToggleSkipVote,
  onImageClick,
}: PhasePreparingProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {room.status === "free_discussion" && (
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4">
            <p className="text-[12px] text-emerald-600 uppercase tracking-wide mb-1">
              Free Discussion
            </p>
            <p className="text-[14px] text-emerald-800">
              自由討論階段已開啟。所有角色都可開麥交流，房間無時間限制。
            </p>
          </div>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className="text-[12px] text-neutral-400 mb-1">
                {paper.year} · {paper.paper_number}
              </p>
              <h2 className="font-serif text-[20px] font-semibold text-neutral-900 tracking-tight">
                {paper.part_a_title}
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
              {paper.topic}
            </span>
          </div>

          <p className="text-[11px] text-neutral-300 mb-3">
            Source: {paper.part_a_source}
          </p>

          <div className="border border-neutral-200/60 rounded-lg p-6 mb-6">
            {paper.page_images &&
            Array.isArray(paper.page_images) &&
            paper.page_images.length > 0 ? (
              <div className="space-y-4">
                {paper.page_images.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onImageClick(url)}
                    className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-neutral-300 rounded overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Section ${idx + 1}`}
                      className="w-full h-auto object-contain max-h-[70vh] cursor-zoom-in"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[14px] text-neutral-600 leading-[1.75] space-y-3">
                {paper.part_a_article?.map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>

          {room.status === "preparing" && (
            <div>
              <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                Discussion Questions
              </p>
              <div className="space-y-2">
                {paper.part_a_discussion_points?.map((point: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-3.5 rounded-lg border border-neutral-200/60"
                  >
                    <span className="text-[13px] font-mono text-neutral-300 mt-0.5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-neutral-700 leading-relaxed">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {room.status === "preparing" && !isObserver && (
          <div>
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
              Notes
            </p>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="整理你的觀點、要點和關鍵詞..."
              className="min-h-[140px] resize-y text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
            Audio / Video
          </p>
          <div className="border border-neutral-200/60 rounded-lg p-4">
            <LiveKitSession
              roomId={roomId}
              roomStatus={room.status}
              currentSpeakerUserId={currentSpeakerUserId}
              isSpectator={isSpectator}
              isMarker={isMarker}
              waitingForMics={isWaitingForMics}
              expectedParticipantCount={participants.length}
              onAllMicsReady={onAllMicsReady}
            />
          </div>
        </div>

        <div>
          <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
            Participants ({participants.length}{departedParticipants.length > 0 ? `/${participants.length + departedParticipants.length}` : ""})
          </p>
          <div className="space-y-1">
            {effectiveDisplayParticipants.map((member, idx) => {
              const isSpeaking = room.status === "individual" && idx === currentSpeakerIndex;
              const memberIsHost = member.user_id === room.host_id;
              const hasVotedSkip = canVoteSkip && room.skip_votes?.includes(member.user_id);
              const hasLeft = member.hasLeft;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-colors ${
                    hasLeft
                      ? "bg-red-50/40 border border-red-100 opacity-60"
                      : isSpeaking
                        ? "bg-neutral-50 border border-neutral-200"
                        : "hover:bg-neutral-50"
                  }`}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      className={`text-[10px] font-medium ${
                        hasLeft
                          ? "bg-neutral-200 text-neutral-400"
                          : isSpeaking
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {member.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate ${hasLeft ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                      {member.profiles?.display_name || "匿名"}
                      {member.user_id === userId && (
                        <span className="text-neutral-400 font-normal"> (你)</span>
                      )}
                    </p>
                  </div>
                  {hasLeft ? (
                    <div className="flex items-center gap-1 text-red-400">
                      <UserX className="h-3 w-3" />
                      <span className="text-[10px] font-medium">已退出</span>
                    </div>
                  ) : (
                    <>
                      {memberIsHost && <span className="text-[10px] text-neutral-400">host</span>}
                      {isSpeaking && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-neutral-300 text-neutral-500"
                        >
                          speaking
                        </Badge>
                      )}
                      {canVoteSkip &&
                        validSkipVotes > 0 &&
                        (hasVotedSkip ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-neutral-200" />
                        ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(spectators.length > 0 || departedMembers.some((d) => d.role === "spectator")) && (
          <div>
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Spectators ({spectators.length})
            </p>
            <div className="space-y-1">
              {spectators.map((spec) => (
                <div key={spec.id} className="flex items-center gap-2.5 p-2 rounded-lg">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[9px] font-medium bg-blue-50 text-blue-500">
                      {spec.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[12px] text-neutral-500 truncate">
                    {spec.profiles?.display_name || "匿名"}
                    {spec.user_id === userId && (
                      <span className="text-neutral-400 font-normal"> (你)</span>
                    )}
                  </p>
                </div>
              ))}
              {departedMembers
                .filter((d) => d.role === "spectator")
                .map((departed) => (
                  <div
                    key={`departed-spec-${departed.user_id}`}
                    className="flex items-center gap-2.5 p-2 rounded-lg opacity-50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] font-medium bg-neutral-200 text-neutral-400">
                        {departed.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[12px] text-neutral-400 truncate line-through">
                      {departed.profiles?.display_name || "匿名"}
                    </p>
                    <span className="text-[10px] text-red-400 ml-auto">已退出</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {(hasMarker || departedMembers.some((d) => d.role === "marker")) && !isMarker && (
          <div>
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Marker
            </p>
            {hasMarker ? (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-violet-50/50 border border-violet-100">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] font-medium bg-violet-600 text-white">
                    {markerMember?.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "MK"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-[13px] font-medium text-neutral-900 truncate">
                  {markerMember?.profiles?.display_name || "Marker"}
                </p>
              </div>
            ) : (
              departedMembers
                .filter((d) => d.role === "marker")
                .map((departed) => (
                  <div
                    key={`departed-marker-${departed.user_id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-50/30 border border-red-100 opacity-60"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-medium bg-neutral-200 text-neutral-400">
                        {departed.profiles?.display_name?.slice(0, 2)?.toUpperCase() || "MK"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[13px] font-medium text-neutral-400 truncate line-through">
                      {departed.profiles?.display_name || "Marker"}
                    </p>
                    <div className="flex items-center gap-1 text-red-400 ml-auto">
                      <UserX className="h-3 w-3" />
                      <span className="text-[10px] font-medium">已退出</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {canVoteSkip && (
          <div>
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
              Controls
            </p>

            {validSkipVotes > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-neutral-400">跳過投票</span>
                  <span className="text-[11px] text-neutral-500 font-medium tabular-nums">
                    {validSkipVotes}/{participants.length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${(validSkipVotes / participants.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className={`w-full text-[13px] transition-all ${
                myVoteSkip
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  : "border-neutral-200 text-neutral-500 hover:text-neutral-900"
              }`}
              onClick={onToggleSkipVote}
            >
              {myVoteSkip ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  已投票跳過
                  {!allVotedSkip && (
                    <span className="ml-1 text-[11px] opacity-70">
                      ({validSkipVotes}/{participants.length})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  跳過
                  {room.status === "preparing" ? "準備" : "討論"}階段
                </>
              )}
            </Button>
            <p className="text-[11px] text-neutral-300 mt-2 text-center">
              需要全部參與者同意才能跳過
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
