"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { RefObject } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room } from "@/lib/supabase/types";
import type { MemberWithProfile } from "@/components/session/session-types";

interface UseSessionSkipVoteParams {
  room: Room | null;
  userId?: string;
  isObserver: boolean;
  participants: MemberWithProfile[];
  allMembers: MemberWithProfile[];
  roomId: string;
  supabase: SupabaseClient;
  phaseTransitionRef: RefObject<boolean>;
  broadcastRef: RefObject<ReturnType<SupabaseClient["channel"]> | null>;
}

export function useSessionSkipVote({
  room,
  userId,
  isObserver,
  participants,
  allMembers,
  roomId,
  supabase,
  phaseTransitionRef,
  broadcastRef,
}: UseSessionSkipVoteParams) {
  const skipVotes = room?.skip_votes ?? [];
  const myVoteSkip = userId ? skipVotes.includes(userId) : false;
  const validSkipVotes = skipVotes.filter((v) =>
    participants.some((m) => m.user_id === v)
  ).length;
  const allVotedSkip =
    participants.length >= 1 && validSkipVotes === participants.length;
  const canVoteSkip =
    !isObserver &&
    (room?.status === "preparing" || room?.status === "discussing");

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
  }, [room, phaseTransitionRef, isObserver, supabase, roomId, allMembers]);

  useEffect(() => {
    if (!allVotedSkip || !room || phaseTransitionRef.current || isObserver) {
      return;
    }
    executeSkipTransition();
  }, [allVotedSkip, room, isObserver, executeSkipTransition, phaseTransitionRef]);

  const handleToggleSkipVote = useCallback(async () => {
    if (!userId || !room || isObserver) return;
    const shouldVoteSkip = !myVoteSkip;

    const persistMyVote = async (): Promise<string[] | null> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: latestRoom, error: fetchErr } = await supabase
          .from("rooms")
          .select("status, current_phase_end_at, skip_votes")
          .eq("id", roomId)
          .single();

        if (fetchErr || !latestRoom) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        const status = latestRoom.status as string;
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
          ? Array.from(new Set([...deduped, userId]))
          : deduped.filter((v) => v !== userId);

        const { error: writeErr } = await supabase
          .from("rooms")
          .update({ skip_votes: nextVotes })
          .eq("id", roomId);

        if (writeErr) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

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

        const hasMyVote = verifyVotes.includes(userId);
        if (hasMyVote === shouldVoteSkip) {
          return verifyVotes;
        }

        await new Promise((r) => setTimeout(r, 400));
      }

      return null;
    };

    const persistedVotes = await persistMyVote();
    if (!persistedVotes) {
      if (room.status === "preparing" || room.status === "discussing") {
        toast.error("投票同步失敗，請重試");
      }
      return;
    }

    broadcastRef.current?.send({
      type: "broadcast",
      event: "room_sync",
      payload: { skip_votes: persistedVotes },
    });

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
  }, [
    userId,
    room,
    isObserver,
    myVoteSkip,
    supabase,
    roomId,
    broadcastRef,
    participants,
    executeSkipTransition,
  ]);

  return {
    skipVotes,
    myVoteSkip,
    validSkipVotes,
    allVotedSkip,
    canVoteSkip,
    handleToggleSkipVote,
    executeSkipTransition,
  };
}
