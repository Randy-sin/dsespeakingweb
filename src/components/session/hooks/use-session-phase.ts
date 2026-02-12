"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { RefObject } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room } from "@/lib/supabase/types";
import type { DisplayParticipant, MemberWithProfile } from "@/components/session/session-types";

const DISCUSSION_DURATION = 8 * 60;
const COUNTDOWN_SECONDS = 3;

interface UseSessionPhaseParams {
  room: Room | null;
  roomId: string;
  supabase: SupabaseClient;
  allMembers: MemberWithProfile[];
  participants: MemberWithProfile[];
  effectiveDisplayParticipants: DisplayParticipant[];
  isObserver: boolean;
  isSpectator: boolean;
  isWaitingForMics: boolean;
  isExpired: boolean;
  partBSubphase: "selecting" | "countdown" | "answering" | null;
  isPartBCountdownExpired: boolean;
}

export function useSessionPhase({
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
}: UseSessionPhaseParams) {
  const phaseTransitionRef = useRef(false);
  const micsReadyRef = useRef(false);

  useEffect(() => {
    if (isWaitingForMics) {
      micsReadyRef.current = false;
    }
  }, [isWaitingForMics]);

  const handleAllMicsReady = useCallback(async () => {
    if (micsReadyRef.current || isObserver || !room) return;
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
  }, [isObserver, room, roomId, supabase]);

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

  useEffect(() => {
    if (!isExpired || !room) return;

    if (phaseTransitionRef.current) {
      console.warn("Phase transition ref stuck, forcing reset");
      phaseTransitionRef.current = false;
    }

    if (room.status !== "preparing" && isObserver) return;

    const transitionPhase = async () => {
      phaseTransitionRef.current = true;

      if (room.status === "preparing") {
        const { error } = await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null,
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");

        if (!error) {
          toast("進入討論階段 — 請開啟麥克風");
        }
      } else if (room.status === "discussing") {
        const hasMarkerInRoom = allMembers.some((m) => m.role === "marker");
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
        if (partBSubphase !== "answering") {
          phaseTransitionRef.current = false;
          return;
        }

        const nextIndex = (room.current_speaker_index ?? 0) + 1;
        const hasMarkerInRoom = allMembers.some((m) => m.role === "marker");
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

  useEffect(() => {
    if (!room || !isExpired || room.status !== "preparing") return;

    const retryTimeout = setTimeout(async () => {
      if (phaseTransitionRef.current) return;

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

    phaseTransitionRef.current = true;

    const advancePastDeparted = async () => {
      let nextIdx = currentIdx + 1;

      while (
        nextIdx < effectiveDisplayParticipants.length &&
        effectiveDisplayParticipants[nextIdx].hasLeft
      ) {
        nextIdx++;
      }

      if (nextIdx < effectiveDisplayParticipants.length) {
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

  return {
    phaseTransitionRef,
    handleAllMicsReady,
    handleManualStartDiscussion,
  };
}
