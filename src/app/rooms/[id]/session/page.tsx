"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useI18n } from "@/components/providers/i18n-provider";
import { useCountdown } from "@/hooks/use-countdown";
import { PhaseIndicator } from "@/components/session/phase-indicator";
import { TimerDisplay } from "@/components/session/timer-display";
import { LiveKitSession } from "@/components/livekit/livekit-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowRight,
  Home,
  Check,
  Circle,
  Eye,
  LogOut,
  Mic,
  ClipboardCheck,
  MessageSquare,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { MarkerScoringPanel } from "@/components/session/marker-scoring-panel";
import { MarkerQuestionSelector } from "@/components/session/marker-question-selector";
import type {
  Room,
  Profile,
  RoomMember,
  PastPaper,
  MarkerScore,
} from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

type PartBQuestion = {
  text?: string;
  question?: string;
  number?: number;
  difficulty?: string;
  difficulty_level?: string;
};

type PartBSubphase = "selecting" | "countdown" | "answering";

/** Evenly distribute N questions across P participants */
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

const DISCUSSION_DURATION = 8 * 60; // 8 minutes in seconds
const COUNTDOWN_SECONDS = 3; // 3-2-1 countdown

export default function SessionPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const { t } = useI18n();
  const supabase = createClient();

  // Keep membership alive with heartbeat
  useHeartbeat(roomId, user?.id);

  const [room, setRoom] = useState<Room | null>(null);
  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [markerScores, setMarkerScores] = useState<MarkerScore[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const phaseTransitionRef = useRef(false);
  const micsReadyRef = useRef(false);

  // Track departed members (members who were in the room but left)
  const seenMembersRef = useRef<Map<string, MemberWithProfile>>(new Map());
  const [departedMembers, setDepartedMembers] = useState<MemberWithProfile[]>([]);
  // Keep a stable snapshot of original participants with their speaking_order for Part B
  const originalParticipantsRef = useRef<MemberWithProfile[]>([]);

  useEffect(() => {
    if (loading) return;

    const currentUserIds = new Set(allMembers.map((m) => m.user_id));
    const seen = seenMembersRef.current;

    // Add all current members to "seen"
    for (const m of allMembers) {
      seen.set(m.user_id, m);
    }

    // Build original participants list (once we have participants with speaking_order)
    const currentParticipants = allMembers.filter((m) => m.role === "participant");
    if (
      originalParticipantsRef.current.length === 0 &&
      currentParticipants.length > 0
    ) {
      originalParticipantsRef.current = [...currentParticipants];
    }
    // Also add any new participants not yet in the original list
    for (const p of currentParticipants) {
      if (!originalParticipantsRef.current.some((op) => op.user_id === p.user_id)) {
        originalParticipantsRef.current.push(p);
      }
    }

    // Compute departed
    const departed: MemberWithProfile[] = [];
    for (const [uid, m] of seen) {
      if (!currentUserIds.has(uid) && uid !== user?.id) {
        departed.push(m);
      }
    }
    
    // Only update if departed list actually changed
    if (
      departed.length !== departedMembers.length ||
      departed.some((d) => !departedMembers.some((dm) => dm.user_id === d.user_id))
    ) {
      setDepartedMembers(departed);
    }
  }, [allMembers, loading, user?.id, departedMembers]);

  // Separate participants from spectators and marker
  const participants = allMembers.filter((m) => m.role === "participant");
  const spectators = allMembers.filter((m) => m.role === "spectator");
  const markerMember = allMembers.find((m) => m.role === "marker");

  // Departed participants who were in participant role
  const departedParticipants = departedMembers.filter((d) => d.role === "participant");
  // Combined participants list that preserves original speaking order (for display)
  // Active participants first, then mark departed ones
  const displayParticipants = originalParticipantsRef.current.map((op) => {
    const active = participants.find((p) => p.user_id === op.user_id);
    if (active) return { ...active, hasLeft: false };
    const departed = departedParticipants.find((d) => d.user_id === op.user_id);
    if (departed) return { ...departed, hasLeft: true };
    return { ...op, hasLeft: true };
  });
  // Fallback: if originalParticipantsRef is still empty, use current participants
  const effectiveDisplayParticipants =
    displayParticipants.length > 0
      ? displayParticipants
      : participants.map((p) => ({ ...p, hasLeft: false }));

  // Detect current user's role
  const myMembership = allMembers.find((m) => m.user_id === user?.id);
  const isSpectator = myMembership?.role === "spectator";
  const isMarker = myMembership?.role === "marker";
  const hasMarker = !!markerMember;
  const isObserver = isSpectator || isMarker; // Observer for room controls/votes

  const fetchData = useCallback(async () => {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (!roomData) return;
    setRoom(roomData);

    if (roomData.paper_id) {
      const { data: paperData } = await supabase
        .from("pastpaper_papers")
        .select("*")
        .eq("id", roomData.paper_id)
        .single();
      setPaper(paperData);
    }

    const { data: memberData } = await supabase
      .from("room_members")
      .select("*, profiles(*)")
      .eq("room_id", roomId)
      .order("speaking_order", { ascending: true });

    if (memberData) {
      setAllMembers(memberData as unknown as MemberWithProfile[]);
    }

    const { data: scoresData } = await supabase
      .from("marker_scores")
      .select("*")
      .eq("room_id", roomId);
    setMarkerScores(scoresData ?? []);

    setLoading(false);
  }, [roomId, supabase]);

  useEffect(() => {
    fetchData();
    
    // Throttle fetchData to prevent excessive calls
    let fetchThrottle: ReturnType<typeof setTimeout> | null = null;
    const throttledFetch = () => {
      if (fetchThrottle) return;
      fetchThrottle = setTimeout(() => {
        fetchData();
        fetchThrottle = null;
      }, 300); // 300ms throttle
    };
    
    const channel = supabase
      .channel(`session-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as Room)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        throttledFetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marker_scores", filter: `room_id=eq.${roomId}` },
        throttledFetch
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (fetchThrottle) clearTimeout(fetchThrottle);
    };
  }, [roomId, fetchData, supabase]);

  const { timeLeft, isExpired } = useCountdown(room?.current_phase_end_at ?? null);
  const { timeLeft: partBCountdownLeft, isExpired: isPartBCountdownExpired } =
    useCountdown(room?.part_b_countdown_end_at ?? null);

  // ---- Waiting for mics + 3-2-1 countdown logic ----
  const isWaitingForMics =
    room?.status === "discussing" && !room?.current_phase_end_at;

  // When discussion timer is set with 3s buffer, calculate countdown number
  // timeLeft > DISCUSSION_DURATION means we're in the countdown phase
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

  // Reset micsReadyRef when we enter a new "waiting for mics" state
  useEffect(() => {
    if (isWaitingForMics) {
      micsReadyRef.current = false;
    }
  }, [isWaitingForMics]);

  // Called by MediaControls when all participants have their mic on
  const handleAllMicsReady = useCallback(async () => {
    if (micsReadyRef.current || isObserver || !room) return;
    micsReadyRef.current = true;

    // Set timer to 8 minutes + 3 seconds (for the countdown)
    const phaseEnd = new Date(
      Date.now() + (DISCUSSION_DURATION + COUNTDOWN_SECONDS) * 1000
    ).toISOString();

    await supabase
      .from("rooms")
      .update({ current_phase_end_at: phaseEnd })
      .eq("id", roomId)
      .eq("status", "discussing")
      .is("current_phase_end_at", null); // Optimistic lock: only first client wins
  }, [isObserver, room, roomId, supabase]);

  // Manual override: start discussion without waiting for all mics
  const handleManualStartDiscussion = useCallback(async () => {
    if (isObserver || !room) return;
    micsReadyRef.current = true;

    const phaseEnd = new Date(
      Date.now() + (DISCUSSION_DURATION + COUNTDOWN_SECONDS) * 1000
    ).toISOString();

    await supabase
      .from("rooms")
      .update({ current_phase_end_at: phaseEnd })
      .eq("id", roomId)
      .eq("status", "discussing")
      .is("current_phase_end_at", null);

    toast.success("討論即將開始");
  }, [isObserver, room, roomId, supabase]);

  // Part B: countdown(3-2-1) -> answering(60s)
  useEffect(() => {
    if (
      !room ||
      room.status !== "individual" ||
      partBSubphase !== "countdown" ||
      !isPartBCountdownExpired ||
      phaseTransitionRef.current ||
      isSpectator
    ) {
      return;
    }

    const startAnsweringWindow = async () => {
      phaseTransitionRef.current = true;
      const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
      await supabase
        .from("rooms")
        .update({
          part_b_subphase: "answering",
          part_b_countdown_end_at: null,
          current_phase_end_at: phaseEnd,
        })
        .eq("id", roomId)
        .eq("status", "individual");

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 1000);
    };

    startAnsweringWindow();
  }, [
    room,
    partBSubphase,
    isPartBCountdownExpired,
    roomId,
    supabase,
    isSpectator,
  ]);

  // ---- Phase transition (any connected user can trigger when timer expires) ----
  // Note: For preparing→discussing, we allow ANY user (including marker) to trigger
  // to ensure reliable transition even if participants have connection issues.
  useEffect(() => {
    if (!isExpired || !room) return;
    
    // Safety: if phaseTransitionRef is stuck for >5s, force reset
    if (phaseTransitionRef.current) {
      console.warn("Phase transition ref stuck, forcing reset");
      phaseTransitionRef.current = false;
    }

    // For preparing phase, allow anyone to trigger (more reliable)
    // For other phases, only participants can trigger
    if (room.status !== "preparing" && isObserver) return;

    const transitionPhase = async () => {
      phaseTransitionRef.current = true;

      if (room.status === "preparing") {
        // Transition to discussing: set current_phase_end_at = null (wait for mics)
        const { error } = await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null, // Timer NOT started yet — wait for all mics
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");

        if (!error) {
          toast("進入討論階段 — 請開啟麥克風");
        }
      } else if (room.status === "discussing") {
        const hasMarkerInRoom =
          allMembers.some((m) => m.role === "marker");
        const phaseEnd = hasMarkerInRoom
          ? null
          : new Date(Date.now() + 1 * 60 * 1000).toISOString();
        await supabase
          .from("rooms")
          .update({
            status: "individual",
            current_phase_end_at: phaseEnd,
            current_speaker_index: 0,
            skip_votes: [],
            marker_questions: {},
            part_b_subphase: hasMarkerInRoom ? "selecting" : "answering",
            part_b_countdown_end_at: null,
          })
          .eq("id", roomId)
          .eq("status", "discussing");
        toast("進入個人回應階段");
      } else if (room.status === "individual") {
        // Only transition automatically when the current answering window is active.
        if (partBSubphase !== "answering") {
          phaseTransitionRef.current = false;
          return;
        }

        const nextIndex = (room.current_speaker_index ?? 0) + 1;
        const hasMarkerInRoom =
          allMembers.some((m) => m.role === "marker");
        if (nextIndex < participants.length) {
          const phaseEnd = hasMarkerInRoom
            ? null
            : new Date(Date.now() + 1 * 60 * 1000).toISOString();
          await supabase
            .from("rooms")
            .update({
              current_phase_end_at: phaseEnd,
              current_speaker_index: nextIndex,
              skip_votes: [],
              part_b_subphase: hasMarkerInRoom ? "selecting" : "answering",
              part_b_countdown_end_at: null,
            })
            .eq("id", roomId);
        } else {
          await supabase
            .from("rooms")
            .update({
              status: "results",
              current_phase_end_at: null,
              current_speaker_index: null,
              skip_votes: [],
              part_b_subphase: null,
              part_b_countdown_end_at: null,
            })
            .eq("id", roomId);
          toast("進入結果公布階段");
        }
      }

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 2000);
    };

    transitionPhase();
  }, [
    isExpired,
    room,
    participants.length,
    roomId,
    supabase,
    isObserver,
    allMembers,
    partBSubphase,
  ]);

  // ---- Fallback: retry phase transition if stuck after timer expired ----
  // This handles edge cases where the initial transition failed silently
  useEffect(() => {
    if (!room || !isExpired || room.status !== "preparing") return;

    // If still in preparing phase 3 seconds after expiry, retry transition
    const retryTimeout = setTimeout(async () => {
      if (phaseTransitionRef.current) return;

      // Double-check room is still in preparing state
      const { data: currentRoom } = await supabase
        .from("rooms")
        .select("status")
        .eq("id", roomId)
        .single();

      if (currentRoom?.status === "preparing") {
        console.log("Fallback: retrying preparing→discussing transition");
        phaseTransitionRef.current = true;

        await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null,
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");

        setTimeout(() => {
          phaseTransitionRef.current = false;
        }, 2000);
      }
    }, 3000);

    return () => clearTimeout(retryTimeout);
  }, [room, isExpired, roomId, supabase]);

  // ---- Auto-skip departed speaker in individual phase ----
  // When the current speaker has left, automatically advance to the next speaker
  useEffect(() => {
    if (
      !room ||
      room.status !== "individual" ||
      phaseTransitionRef.current ||
      isObserver ||
      effectiveDisplayParticipants.length === 0
    ) {
      return;
    }

    const currentIdx = room.current_speaker_index ?? 0;
    const currentDisplay = effectiveDisplayParticipants[currentIdx];
    if (!currentDisplay || !currentDisplay.hasLeft) return;

    // Current speaker has departed — find the next active speaker
    phaseTransitionRef.current = true;

    const advancePastDeparted = async () => {
      let nextIdx = currentIdx + 1;

      // Skip all consecutive departed speakers
      while (
        nextIdx < effectiveDisplayParticipants.length &&
        effectiveDisplayParticipants[nextIdx].hasLeft
      ) {
        nextIdx++;
      }

      if (nextIdx < effectiveDisplayParticipants.length) {
        // Advance to next active speaker
        const hasMarkerInRoom = allMembers.some((m) => m.role === "marker");
        const phaseEnd = hasMarkerInRoom
          ? null
          : new Date(Date.now() + 1 * 60 * 1000).toISOString();

        await supabase
          .from("rooms")
          .update({
            current_speaker_index: nextIdx,
            current_phase_end_at: phaseEnd,
            skip_votes: [],
            part_b_subphase: hasMarkerInRoom ? "selecting" : "answering",
            part_b_countdown_end_at: null,
          })
          .eq("id", roomId)
          .eq("status", "individual");

        toast(`${currentDisplay.profiles?.display_name || "參與者"} 已退出，跳至下一位`);
      } else {
        // All remaining speakers departed — go to results
        await supabase
          .from("rooms")
          .update({
            status: "results",
            current_phase_end_at: null,
            current_speaker_index: null,
            skip_votes: [],
            part_b_subphase: null,
            part_b_countdown_end_at: null,
          })
          .eq("id", roomId);
        toast("所有發言者已結束，進入結果階段");
      }

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 2000);
    };

    // Short delay to prevent race conditions with other transitions
    const timeout = setTimeout(advancePastDeparted, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [
    room,
    effectiveDisplayParticipants,
    isObserver,
    allMembers,
    supabase,
    roomId,
  ]);

  // ---- Voting to skip current phase (participants only) ----
  const skipVotes = room?.skip_votes ?? [];
  const myVoteSkip = user ? skipVotes.includes(user.id) : false;
  const validSkipVotes = skipVotes.filter((v) =>
    participants.some((m) => m.user_id === v)
  ).length;
  const allVotedSkip =
    participants.length >= 1 && validSkipVotes === participants.length;

  const executeSkipTransition = useCallback(async () => {
    if (!room || phaseTransitionRef.current || isObserver) return;
    phaseTransitionRef.current = true;
    try {
      const { data: latestRoom, error: latestRoomError } = await supabase
        .from("rooms")
        .select("status")
        .eq("id", roomId)
        .single();

      if (latestRoomError || !latestRoom) {
        toast.error("跳過失敗，請重試");
        return;
      }

      if (latestRoom.status === "preparing") {
        const { error } = await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null,
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");

        if (error) {
          toast.error("跳過失敗，請重試");
          return;
        }
        toast.success("全員同意，跳過準備階段 — 請開啟麥克風");
      } else if (latestRoom.status === "discussing") {
        const hasMarkerInRoom = allMembers.some((m) => m.role === "marker");
        const phaseEnd = hasMarkerInRoom
          ? null
          : new Date(Date.now() + 1 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from("rooms")
          .update({
            status: "individual",
            current_phase_end_at: phaseEnd,
            current_speaker_index: 0,
            skip_votes: [],
            marker_questions: {},
            part_b_subphase: hasMarkerInRoom ? "selecting" : "answering",
            part_b_countdown_end_at: null,
          })
          .eq("id", roomId)
          .eq("status", "discussing");

        if (error) {
          toast.error("跳過失敗，請重試");
          return;
        }
        toast.success("全員同意，跳過討論階段");
      }
    } finally {
      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 1200);
    }
  }, [room, isObserver, supabase, roomId, allMembers]);

  // Auto-execute skip when all participants voted
  useEffect(() => {
    if (!allVotedSkip || !room || phaseTransitionRef.current || isObserver) {
      return;
    }
    executeSkipTransition();
  }, [allVotedSkip, room, isObserver, executeSkipTransition]);

  const handleToggleSkipVote = async () => {
    if (!user || !room || isObserver) return;
    const shouldVoteSkip = !myVoteSkip;

    const persistMyVote = async (): Promise<string[] | null> => {
      // Retry to avoid lost updates on mobile / high latency.
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: latestRoom, error: fetchErr } = await supabase
          .from("rooms")
          .select("status, current_phase_end_at, skip_votes")
          .eq("id", roomId)
          .single();

        if (fetchErr || !latestRoom) {
          // Network or RLS issue – wait briefly and retry
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        const status = latestRoom.status as string;

        // If room already moved past skippable phases, don't error —
        // just tell the user the phase already advanced.
        const skippablePhases = ["preparing", "discussing"];
        if (!skippablePhases.includes(status)) {
          toast.info("階段已切換，無需跳過");
          return null;
        }

        const latestVotes = Array.isArray(latestRoom.skip_votes)
          ? (latestRoom.skip_votes as string[])
          : [];

        const deduped = Array.from(new Set(latestVotes));
        const nextVotes = shouldVoteSkip
          ? Array.from(new Set([...deduped, user.id]))
          : deduped.filter((v) => v !== user.id);

        const { error: writeErr } = await supabase
          .from("rooms")
          .update({ skip_votes: nextVotes })
          .eq("id", roomId);

        if (writeErr) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        // Verify the write
        const { data: verifyRoom, error: verifyErr } = await supabase
          .from("rooms")
          .select("skip_votes")
          .eq("id", roomId)
          .single();

        if (verifyErr || !verifyRoom) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        const verifyVotes = Array.isArray(verifyRoom.skip_votes)
          ? (verifyRoom.skip_votes as string[])
          : [];

        const hasMyVote = verifyVotes.includes(user.id);
        if (hasMyVote === shouldVoteSkip) {
          return verifyVotes;
        }

        // Vote not persisted — wait and retry
        await new Promise((r) => setTimeout(r, 400));
      }

      return null;
    };

    const persistedVotes = await persistMyVote();
    if (!persistedVotes) {
      // Only show error if persistMyVote didn't already show a toast
      if (
        room.status === "preparing" ||
        room.status === "discussing"
      ) {
        toast.error("投票同步失敗，請重試");
      }
      return;
    }

    if (!shouldVoteSkip) return;

    const validNewVotes = persistedVotes.filter((v) =>
      participants.some((m) => m.user_id === v)
    ).length;
    const canExecuteNow =
      participants.length >= 1 && validNewVotes === participants.length;

    if (canExecuteNow) {
      await executeSkipTransition();
    } else {
      toast.success("已投票跳過");
    }
  };

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
  const isCurrentSpeaker = user?.id === currentSpeaker?.user_id;
  const rawPartBQuestions = (paper.part_b_questions as PartBQuestion[]) || [];
  const assignedQuestions = assignQuestions(rawPartBQuestions, participants.length);

  const canVoteSkip =
    !isObserver &&
    (room.status === "preparing" || room.status === "discussing");

  // Marker-selected question for current speaker
  const markerQuestions = (room.marker_questions ?? {}) as Record<string, number>;
  const markerSelectedQIdx = markerQuestions[String(currentSpeakerIndex)];
  const markerSelectedQuestion =
    hasMarker && markerSelectedQIdx !== undefined && markerSelectedQIdx !== null
      ? rawPartBQuestions[markerSelectedQIdx]
      : null;

  // Determine which question to show: marker-selected or auto-assigned
  const displayQuestion =
    room.status === "individual" &&
    (partBSubphase === "answering" || !hasMarker)
      ? hasMarker
        ? markerSelectedQuestion
        : assignedQuestions[currentSpeakerIndex] ?? null
      : null;

  // Timer display label
  const timerLabel = isWaitingForMics
    ? "Mic Check"
    : room.status === "preparing"
      ? "Prep"
      : room.status === "discussing"
        ? "Discussion"
        : room.status === "individual"
          ? `Individual ${currentSpeakerIndex + 1}/${participants.length}`
          : room.status === "results"
            ? "Results"
            : room.status === "free_discussion"
              ? "Free Talk"
          : "Done";

  return (
    <div className="min-h-screen bg-white">
      {/* 3-2-1 Countdown Overlay */}
      {countdownNumber !== null && countdownNumber > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div
              key={countdownNumber}
              className="text-white text-[140px] font-bold leading-none animate-bounce"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {countdownNumber}
            </div>
            <p className="text-white/60 text-[16px] mt-6 tracking-wide">
              Discussion starts in...
            </p>
          </div>
        </div>
      )}

      {/* Part B 3-2-1 overlay */}
      {partBCountdownNumber !== null && partBCountdownNumber > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div
              key={`partb-${partBCountdownNumber}`}
              className="text-white text-[140px] font-bold leading-none animate-bounce"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {partBCountdownNumber}
            </div>
            <p className="text-white/70 text-[15px] mt-5 tracking-wide">
              Part B starts in...
            </p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-serif text-[15px] font-semibold text-neutral-900 tracking-tight"
            >
              DSE
            </Link>
            <Separator orientation="vertical" className="h-5 bg-neutral-200" />
            <PhaseIndicator currentPhase={room.status} />
          </div>
          <div className="flex items-center gap-3">
            {isSpectator && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Eye className="h-3 w-3" />
                觀眾模式
              </span>
            )}
            {isMarker && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                <ClipboardCheck className="h-3 w-3" />
                Marker
              </span>
            )}
            <TimerDisplay
              targetDate={room.current_phase_end_at}
              label={timerLabel}
            />
          </div>
        </div>
      </div>

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
        {/* Results */}
        {room.status === "results" && (
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
                  const score = markerScores.find(
                    (s) => s.candidate_id === candidate.user_id
                  );
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
                              {candidate.profiles?.display_name
                                ?.slice(0, 2)
                                ?.toUpperCase() || "??"}
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
                {isMarker && user && (
                  <MarkerScoringPanel
                    roomId={roomId}
                    markerId={user.id}
                    participants={participants}
                  />
                )}
                <div className="rounded-xl border border-neutral-200/70 p-4 space-y-2">
                  <p className="text-[12px] text-neutral-400 uppercase tracking-wide">
                    Next Step
                  </p>
                  <Button
                    className="w-full"
                    onClick={handleStartFreeDiscussion}
                    disabled={isSpectator}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Free Discussion
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleFinishSession}
                    disabled={isSpectator}
                  >
                    End Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finished */}
        {room.status === "finished" && (
          <div className="text-center py-20">
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-4">
              Session Complete
            </p>
            <h2 className="font-serif text-[32px] font-semibold text-neutral-900 tracking-tight mb-3">
              練習完成
            </h2>
            <p className="text-[15px] text-neutral-400 mb-10 max-w-md mx-auto">
              {isMarker
                ? "練習已結束。你可以在下方完成評分。"
                : isSpectator
                ? "你觀看的 DSE Speaking 模擬練習已經結束。"
                : "你完成了一次完整的 DSE Speaking 模擬練習。回顧討論中的表現，持續進步。"}
            </p>

            {/* Marker scoring panel after finish */}
            {isMarker && user && (
              <div className="max-w-lg mx-auto mb-10">
                <MarkerScoringPanel
                  roomId={roomId}
                  markerId={user.id}
                  participants={participants}
                />
              </div>
            )}

            <Link href="/rooms">
              <Button className="h-10 px-6 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-full">
                <Home className="mr-2 h-4 w-4" />
                返回
              </Button>
            </Link>
          </div>
        )}

        {/* Active */}
        {room.status !== "finished" && room.status !== "results" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
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

              {/* Topic */}
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

                {/* Article: show PDF images when available, else text */}
                <div className="border border-neutral-200/60 rounded-lg p-6 mb-6">
                  {paper.page_images &&
                  Array.isArray(paper.page_images) &&
                  paper.page_images.length > 0 ? (
                    <div className="space-y-4">
                      {paper.page_images.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxImg(url)}
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
                      {paper.part_a_article?.map(
                        (paragraph: string, idx: number) => (
                          <p key={idx}>{paragraph}</p>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Lightbox */}
                {lightboxImg && (
                  <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImg(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Escape" && setLightboxImg(null)
                    }
                  >
                    <img
                      src={lightboxImg}
                      alt="放大"
                      className="max-w-full max-h-[90vh] object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImg(null)}
                      className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Discussion Questions */}
                {(room.status === "preparing" ||
                  room.status === "discussing") && (
                  <div>
                    <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                      Discussion Questions
                    </p>
                    <div className="space-y-2">
                      {paper.part_a_discussion_points?.map(
                        (point: string, idx: number) => (
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
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Individual Response */}
                {room.status === "individual" && (
                  <div>
                    <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                      Individual Response — Part B
                    </p>

                    {/* Speaker queue overview */}
                    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                      {effectiveDisplayParticipants.map((m, idx) => {
                        const isActive = idx === currentSpeakerIndex;
                        const isDone = idx < currentSpeakerIndex;
                        const hasLeft = m.hasLeft;
                        return (
                          <div
                            key={m.user_id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${
                              hasLeft
                                ? "bg-red-50 text-red-400 line-through"
                                : isActive
                                  ? "bg-neutral-900 text-white shadow-sm"
                                  : isDone
                                    ? "bg-emerald-50 text-emerald-600 line-through"
                                    : "bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            {hasLeft && <UserX className="h-3 w-3" />}
                            {!hasLeft && isDone && <Check className="h-3 w-3" />}
                            {!hasLeft && isActive && <Mic className="h-3 w-3 animate-pulse" />}
                            <span>
                              {m.profiles?.display_name?.split(" ")[0] || `#${idx + 1}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Current speaker & question */}
                    <div className="border border-neutral-200/60 rounded-xl overflow-hidden">
                      {/* Speaker header */}
                      <div className="flex items-center gap-3 px-5 py-4 bg-neutral-50/70 border-b border-neutral-100">
                        <Avatar className="h-9 w-9 ring-2 ring-neutral-900 ring-offset-2">
                          <AvatarFallback className="bg-neutral-900 text-white text-[11px] font-semibold">
                            {currentSpeaker?.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-neutral-900 truncate">
                            {currentSpeaker?.profiles?.display_name || "Speaker"}
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            {isCurrentSpeaker
                              ? "Your turn — answer the question below"
                              : `Candidate ${currentSpeakerIndex + 1} of ${participants.length} is responding`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                          {currentSpeakerIndex + 1} / {participants.length}
                        </Badge>
                      </div>

                      {/* Question card */}
                      {displayQuestion ? (() => {
                        const q = displayQuestion;
                        const questionText = q?.text ?? q?.question ?? "";
                        const questionNum = q?.number;
                        const difficulty = q?.difficulty;
                        const difficultyLevel = q?.difficulty_level;

                        return (
                          <div className="px-5 py-5 space-y-3">
                            {/* Question number & difficulty */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {questionNum && (
                                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md bg-neutral-900 text-white text-[11px] font-bold font-mono">
                                  Q{questionNum}
                                </span>
                              )}
                              {difficulty && (
                                <Badge
                                  variant="secondary"
                                  className={`text-[11px] font-medium ${
                                    difficulty === "hard"
                                      ? "bg-red-50 text-red-600 border-red-200"
                                      : difficulty === "medium"
                                      ? "bg-amber-50 text-amber-600 border-amber-200"
                                      : "bg-green-50 text-green-600 border-green-200"
                                  }`}
                                >
                                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                </Badge>
                              )}
                              {difficultyLevel && (
                                <span className="text-[11px] text-neutral-400 font-mono">
                                  Level {difficultyLevel}
                                </span>
                              )}
                              {hasMarker && (
                                <span className="text-[10px] text-violet-400 ml-auto">
                                  {t("session.selectedByMarker", "selected by Marker")}
                                </span>
                              )}
                            </div>

                            {/* Question text */}
                            <p className="text-[16px] leading-[1.7] text-neutral-800 font-medium">
                              {questionText}
                            </p>

                            {/* Tip for current speaker */}
                            {isCurrentSpeaker && (
                              <div className="mt-2 flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50/60 border border-blue-100">
                                <Mic className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-blue-700 leading-relaxed">
                                  You have <strong>1 minute</strong> to respond. Speak clearly and support your answer with reasons or examples.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })() : hasMarker ? (
                        <div className="px-5 py-8 text-center">
                          <ClipboardCheck className="h-6 w-6 text-violet-300 mx-auto mb-2" />
                          <p className="text-[14px] text-neutral-500 font-medium">
                            {partBSubphase === "countdown"
                              ? "3-2-1 倒數中，題目即將顯示..."
                              : t(
                                  "session.waitingMarkerQuestion",
                                  "Waiting for Marker to select a question..."
                                )}
                          </p>
                          <p className="text-[12px] text-neutral-400 mt-1">
                            {partBSubphase === "countdown"
                              ? "請當前考生準備回答。"
                              : t(
                                  "session.markerSelectingQuestion",
                                  "Marker is selecting a question for the current candidate"
                                )}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Questions pool for all (visible after all speakers done or for spectators) */}
                    {(isSpectator || (!isMarker && currentSpeakerIndex >= participants.length)) && rawPartBQuestions.length > 0 && (
                      <div className="mt-4 border border-neutral-200/60 rounded-xl p-4">
                        <p className="text-[12px] text-neutral-400 uppercase tracking-wide mb-3">
                          All Part B Questions
                        </p>
                        <div className="space-y-2">
                          {rawPartBQuestions.map((q, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 items-start text-[13px]"
                            >
                              <span className="font-mono text-neutral-300 mt-px shrink-0 w-5 text-right">
                                {q.number ?? idx + 1}.
                              </span>
                              <span className="text-neutral-600 leading-relaxed">
                                {q.text ?? q.question ?? ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes (participants only) */}
              {room.status === "preparing" && !isObserver && (
                <div>
                  <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                    Notes
                  </p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="整理你的觀點、要點和關鍵詞..."
                    className="min-h-[140px] resize-y text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Audio/Video */}
              <div>
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                  Audio / Video
                </p>
                <div className="border border-neutral-200/60 rounded-lg p-4">
                  <LiveKitSession
                    roomId={roomId}
                    roomStatus={room.status}
                    currentSpeakerUserId={currentSpeaker?.user_id}
                    isSpectator={isSpectator}
                    isMarker={isMarker}
                    waitingForMics={isWaitingForMics}
                    expectedParticipantCount={participants.length}
                    onAllMicsReady={handleAllMicsReady}
                  />
                </div>
              </div>

              {/* Participants */}
              <div>
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                  Participants ({participants.length}{departedParticipants.length > 0 ? `/${participants.length + departedParticipants.length}` : ""})
                </p>
                <div className="space-y-1">
                  {effectiveDisplayParticipants.map((member, idx) => {
                    const isSpeaking =
                      room.status === "individual" &&
                      idx === currentSpeakerIndex;
                    const memberIsHost = member.user_id === room.host_id;
                    const hasVotedSkip =
                      canVoteSkip && skipVotes.includes(member.user_id);
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
                            {member.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium truncate ${hasLeft ? "text-neutral-400 line-through" : "text-neutral-900"}`}>
                            {member.profiles?.display_name || "匿名"}
                            {member.user_id === user?.id && (
                              <span className="text-neutral-400 font-normal">
                                {" "}
                                (你)
                              </span>
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
                            {memberIsHost && (
                              <span className="text-[10px] text-neutral-400">
                                host
                              </span>
                            )}
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

              {/* Spectators */}
              {(spectators.length > 0 || departedMembers.some((d) => d.role === "spectator")) && (
                <div>
                  <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Spectators ({spectators.length})
                  </p>
                  <div className="space-y-1">
                    {spectators.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] font-medium bg-blue-50 text-blue-500">
                            {spec.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-[12px] text-neutral-500 truncate">
                          {spec.profiles?.display_name || "匿名"}
                          {spec.user_id === user?.id && (
                            <span className="text-neutral-400 font-normal">
                              {" "}
                              (你)
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                    {/* Departed spectators */}
                    {departedMembers
                      .filter((d) => d.role === "spectator")
                      .map((departed) => (
                        <div
                          key={`departed-spec-${departed.user_id}`}
                          className="flex items-center gap-2.5 p-2 rounded-lg opacity-50"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] font-medium bg-neutral-200 text-neutral-400">
                              {departed.profiles?.display_name
                                ?.slice(0, 2)
                                ?.toUpperCase() || "??"}
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

              {/* Marker: Question Selector (during individual phase) */}
              {isMarker && room.status === "individual" && (
                <MarkerQuestionSelector
                  room={room}
                  roomId={roomId}
                  participants={participants}
                  questions={rawPartBQuestions}
                  currentSpeakerIndex={currentSpeakerIndex}
                />
              )}

              {/* Marker: Scoring Panel */}
              {isMarker && user && (room.status === "discussing" || room.status === "individual") && (
                <MarkerScoringPanel
                  roomId={roomId}
                  markerId={user.id}
                  participants={participants}
                />
              )}

              {/* Marker in sidebar */}
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

              {/* Skip Phase Voting Controls (participants only) */}
              {canVoteSkip && (
                <div>
                  <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                    Controls
                  </p>

                  {/* Vote progress bar */}
                  {validSkipVotes > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-neutral-400">
                          跳過投票
                        </span>
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
                    onClick={handleToggleSkipVote}
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
        )}
      </div>
    </div>
  );
}
