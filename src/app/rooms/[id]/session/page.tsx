"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  LogOut,
  Mic,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { CountdownOverlay } from "@/components/session/ui/countdown-overlay";
import { SessionTopBar } from "@/components/session/ui/top-bar";
import { LightboxModal } from "@/components/session/ui/lightbox-modal";
import { useSessionMembers } from "@/components/session/hooks/use-session-members";
import { useSessionTimers } from "@/components/session/hooks/use-session-timers";
import { useSessionPartBDisplay } from "@/components/session/hooks/use-session-partb-display";
import { useSessionData } from "@/components/session/hooks/use-session-data";
import { useSessionPhase } from "@/components/session/hooks/use-session-phase";
import { useSessionSkipVote } from "@/components/session/hooks/use-session-skip-vote";
import { PhaseResults } from "@/components/session/phases/phase-results";
import { PhaseFinished } from "@/components/session/phases/phase-finished";
import { PhasePreparing } from "@/components/session/phases/phase-preparing";
import { PhaseDiscussionIndividual } from "@/components/session/phases/phase-discussion-individual";

export default function SessionPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const { t } = useI18n();

  // Keep membership alive with heartbeat
  useHeartbeat(roomId, user?.id);

  const [notes, setNotes] = useState("");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);

  const {
    supabase,
    room,
    allMembers,
    paper,
    markerScores,
    loading,
    broadcastRef,
  } = useSessionData(roomId);

  const {
    participants,
    spectators,
    markerMember,
    departedMembers,
    departedParticipants,
    effectiveDisplayParticipants,
    isSpectator,
    isMarker,
    hasMarker,
    isObserver,
  } = useSessionMembers({
    allMembers,
    loading,
    currentUserId: user?.id,
  });

  const {
    isExpired,
    isPartBCountdownExpired,
    isWaitingForMics,
    countdownNumber,
    partBSubphase,
    partBCountdownNumber,
    timerLabel,
  } = useSessionTimers({
    room,
    currentSpeakerIndex: room?.current_speaker_index ?? 0,
    participantsLength: participants.length,
  });

  const { handleAllMicsReady, handleManualStartDiscussion, phaseTransitionRef } =
    useSessionPhase({
      room,
      roomId,
      supabase,
      allMembers,
      participants,
      effectiveDisplayParticipants,
      isObserver,
      isSpectator,
      isWaitingForMics,
      isExpired,
      partBSubphase,
      isPartBCountdownExpired,
    });

  const {
    myVoteSkip,
    validSkipVotes,
    allVotedSkip,
    canVoteSkip,
    handleToggleSkipVote,
  } = useSessionSkipVote({
    room,
    userId: user?.id,
    isObserver,
    participants,
    allMembers,
    roomId,
    supabase,
    phaseTransitionRef,
    broadcastRef,
  });

  const handleLeaveSpectator = async () => {
    if (!user || !isSpectator) return;
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);
    toast.success("已退出觀看");
    router.push("/rooms");
  };

  const handleStartFreeDiscussion = async () => {
    if (!room || isSpectator) return;
    await supabase
      .from("rooms")
      .update({
        status: "free_discussion",
        current_phase_end_at: null,
        part_b_subphase: null,
        part_b_countdown_end_at: null,
      })
      .eq("id", roomId)
      .eq("status", "results");
    toast.success("進入自由討論");
  };

  const handleFinishSession = async () => {
    if (!room || isSpectator) return;
    await supabase
      .from("rooms")
      .update({
        status: "finished",
        current_phase_end_at: null,
        current_speaker_index: null,
        part_b_subphase: null,
        part_b_countdown_end_at: null,
      })
      .eq("id", roomId);
    toast.success("會話已結束");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!room || !paper) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-neutral-400 mb-4">房間或題目不存在</p>
          <Link href="/rooms">
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] h-9 rounded-full px-5">
              返回
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSpeakerIndex = room.current_speaker_index ?? 0;
  const currentSpeaker = participants[currentSpeakerIndex];
  const {
    rawPartBQuestions,
    displayQuestion,
  } = useSessionPartBDisplay({
    room,
    paper,
    participants,
    currentSpeakerIndex,
    hasMarker,
    partBSubphase,
  });

  const isDiscussionOrIR =
    room.status === "discussing" || room.status === "individual";
  const discussionPoints = paper.part_a_discussion_points ?? [];

  return (
    <div className="min-h-screen bg-white">
      <CountdownOverlay
        countdownNumber={countdownNumber}
        partBCountdownNumber={partBCountdownNumber}
      />
      <SessionTopBar
        roomStatus={room.status}
        isSpectator={isSpectator}
        isMarker={isMarker}
        timerTargetDate={room.current_phase_end_at}
        timerLabel={timerLabel}
      />

      {/* Waiting for Mics Banner */}
      {isWaitingForMics && !isObserver && (
        <div className="bg-amber-50/80 border-b border-amber-200/60">
          <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Mic className="h-4 w-4 text-amber-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[13px] text-amber-900 font-medium">
                  {t(
                    "livekit.waitingMicsTitle",
                    "Waiting for all participants to enable microphone"
                  )}
                </p>
                <p className="text-[11px] text-amber-600">
                  {t(
                    "livekit.waitingMicsDesc",
                    "A 3-2-1 countdown starts automatically when everyone is ready"
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px] border-amber-300 text-amber-700 hover:bg-amber-100 h-8"
              onClick={handleManualStartDiscussion}
            >
              {t("livekit.startNow", "Start now")}
            </Button>
          </div>
        </div>
      )}

      {/* Spectator banner */}
      {isSpectator && room.status !== "finished" && (
        <div className="bg-blue-50/60 border-b border-blue-100/60">
          <div className="max-w-7xl mx-auto px-5 py-2 flex items-center justify-between">
            <p className="text-[12px] text-blue-600">
              {t(
                "session.spectatorHint",
                "You are watching this session as an observer. You can see prompts and hear discussion, but cannot interact."
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px] text-blue-500 hover:text-blue-700 h-7"
              onClick={handleLeaveSpectator}
            >
              <LogOut className="mr-1 h-3 w-3" />
              {t("session.leaveWatching", "Leave viewing")}
            </Button>
          </div>
        </div>
      )}

      {/* Marker banner */}
      {isMarker && room.status !== "finished" && (
        <div className="bg-violet-50/60 border-b border-violet-100/60">
          <div className="max-w-7xl mx-auto px-5 py-2 flex items-center">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5 text-violet-500" />
              <p className="text-[12px] text-violet-600">
                {t(
                  "session.markerMode",
                  "Marker mode — you can score and choose Individual Response questions"
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 py-6">
        {room.status === "results" && (
          <PhaseResults
            roomId={roomId}
            markerScores={markerScores}
            effectiveDisplayParticipants={effectiveDisplayParticipants}
            participants={participants}
            isMarker={isMarker}
            isSpectator={isSpectator}
            userId={user?.id}
            onStartFreeDiscussion={handleStartFreeDiscussion}
            onFinishSession={handleFinishSession}
          />
        )}

        {room.status === "finished" && (
          <PhaseFinished
            roomId={roomId}
            participants={participants}
            isMarker={isMarker}
            isSpectator={isSpectator}
            userId={user?.id}
          />
        )}

        {/* Active */}
        {room.status !== "finished" && room.status !== "results" && (
          <>
            {isDiscussionOrIR ? (
              <PhaseDiscussionIndividual
                roomId={roomId}
                room={room}
                paper={paper}
                participants={participants}
                spectators={spectators}
                departedMembers={departedMembers}
                effectiveDisplayParticipants={effectiveDisplayParticipants}
                currentSpeakerIndex={currentSpeakerIndex}
                currentSpeaker={currentSpeaker}
                rawPartBQuestions={rawPartBQuestions}
                displayQuestion={displayQuestion}
                discussionPoints={discussionPoints}
                timerLabel={timerLabel}
                isSpectator={isSpectator}
                isMarker={isMarker}
                hasMarker={hasMarker}
                isWaitingForMics={isWaitingForMics}
                isSidePanelCollapsed={isSidePanelCollapsed}
                canVoteSkip={canVoteSkip}
                myVoteSkip={myVoteSkip}
                validSkipVotes={validSkipVotes}
                userId={user?.id}
                onToggleSidePanel={() => setIsSidePanelCollapsed((prev) => !prev)}
                onToggleSkipVote={handleToggleSkipVote}
                onAllMicsReady={handleAllMicsReady}
                onImageClick={setLightboxImg}
              />
            ) : (
              <PhasePreparing
                roomId={roomId}
                room={room}
                paper={paper}
                notes={notes}
                onNotesChange={setNotes}
                currentSpeakerUserId={currentSpeaker?.user_id}
                participants={participants}
                spectators={spectators}
                markerMember={markerMember}
                departedMembers={departedMembers}
                departedParticipants={departedParticipants}
                effectiveDisplayParticipants={effectiveDisplayParticipants}
                currentSpeakerIndex={currentSpeakerIndex}
                isSpectator={isSpectator}
                isMarker={isMarker}
                isObserver={isObserver}
                hasMarker={hasMarker}
                isWaitingForMics={isWaitingForMics}
                canVoteSkip={canVoteSkip}
                validSkipVotes={validSkipVotes}
                myVoteSkip={myVoteSkip}
                allVotedSkip={allVotedSkip}
                userId={user?.id}
                onAllMicsReady={handleAllMicsReady}
                onToggleSkipVote={handleToggleSkipVote}
                onImageClick={setLightboxImg}
              />
            )}
          </>
        )}

        <LightboxModal image={lightboxImg} onClose={() => setLightboxImg(null)} />
      </div>
    </div>
  );
}
