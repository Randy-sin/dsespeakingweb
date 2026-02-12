"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DisplayParticipant, MemberWithProfile } from "@/components/session/session-types";

interface UseSessionMembersParams {
  allMembers: MemberWithProfile[];
  loading: boolean;
  currentUserId?: string;
}

export function useSessionMembers({
  allMembers,
  loading,
  currentUserId,
}: UseSessionMembersParams) {
  const seenMembersRef = useRef<Map<string, MemberWithProfile>>(new Map());
  const [departedMembers, setDepartedMembers] = useState<MemberWithProfile[]>([]);
  const originalParticipantsRef = useRef<MemberWithProfile[]>([]);

  useEffect(() => {
    if (loading) return;

    const currentUserIds = new Set(allMembers.map((m) => m.user_id));
    const seen = seenMembersRef.current;

    for (const m of allMembers) seen.set(m.user_id, m);

    const currentParticipants = allMembers.filter((m) => m.role === "participant");
    if (originalParticipantsRef.current.length === 0 && currentParticipants.length > 0) {
      originalParticipantsRef.current = [...currentParticipants];
    }
    for (const p of currentParticipants) {
      if (!originalParticipantsRef.current.some((op) => op.user_id === p.user_id)) {
        originalParticipantsRef.current.push(p);
      }
    }

    const departed: MemberWithProfile[] = [];
    for (const [uid, m] of seen) {
      if (!currentUserIds.has(uid) && uid !== currentUserId) {
        departed.push(m);
      }
    }

    if (
      departed.length !== departedMembers.length ||
      departed.some((d) => !departedMembers.some((dm) => dm.user_id === d.user_id))
    ) {
      setDepartedMembers(departed);
    }
  }, [allMembers, loading, currentUserId, departedMembers]);

  const participants = useMemo(
    () => allMembers.filter((m) => m.role === "participant"),
    [allMembers]
  );
  const spectators = useMemo(
    () => allMembers.filter((m) => m.role === "spectator"),
    [allMembers]
  );
  const markerMember = useMemo(
    () => allMembers.find((m) => m.role === "marker"),
    [allMembers]
  );
  const departedParticipants = useMemo(
    () => departedMembers.filter((d) => d.role === "participant"),
    [departedMembers]
  );

  const displayParticipants = useMemo<DisplayParticipant[]>(() => {
    return originalParticipantsRef.current.map((op) => {
      const active = participants.find((p) => p.user_id === op.user_id);
      if (active) return { ...active, hasLeft: false };
      const departed = departedParticipants.find((d) => d.user_id === op.user_id);
      if (departed) return { ...departed, hasLeft: true };
      return { ...op, hasLeft: true };
    });
  }, [participants, departedParticipants]);

  const effectiveDisplayParticipants = useMemo<DisplayParticipant[]>(
    () =>
      displayParticipants.length > 0
        ? displayParticipants
        : participants.map((p) => ({ ...p, hasLeft: false })),
    [displayParticipants, participants]
  );

  const myMembership = useMemo(
    () => allMembers.find((m) => m.user_id === currentUserId),
    [allMembers, currentUserId]
  );
  const isSpectator = myMembership?.role === "spectator";
  const isMarker = myMembership?.role === "marker";
  const hasMarker = !!markerMember;
  const isObserver = isSpectator || isMarker;

  return {
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
  };
}
