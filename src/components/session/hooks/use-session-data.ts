"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MarkerScore, PastPaper, Room } from "@/lib/supabase/types";
import type { MemberWithProfile } from "@/components/session/session-types";

export function useSessionData(roomId: string) {
  const supabase = createClient();
  const [room, setRoom] = useState<Room | null>(null);
  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [markerScores, setMarkerScores] = useState<MarkerScore[]>([]);
  const [loading, setLoading] = useState(true);

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

  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetchData();

    const pgChannel = supabase
      .channel(`pg-session-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marker_scores", filter: `room_id=eq.${roomId}` },
        () => fetchData()
      )
      .subscribe();

    const bc = supabase
      .channel(`bc-session-${roomId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "room_sync" }, (payload) => {
        const data = payload?.payload;
        if (!data) return;
        setRoom((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          if (data.skip_votes !== undefined) updated.skip_votes = data.skip_votes;
          if (data.status !== undefined) updated.status = data.status;
          return updated;
        });
      })
      .subscribe();
    broadcastRef.current = bc;

    const pollInterval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(bc);
      broadcastRef.current = null;
      clearInterval(pollInterval);
    };
  }, [roomId, fetchData, supabase]);

  return {
    supabase,
    room,
    setRoom,
    allMembers,
    paper,
    markerScores,
    loading,
    broadcastRef,
  };
}
