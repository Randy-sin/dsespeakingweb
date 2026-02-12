"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

/**
 * Sends periodic heartbeat to keep room membership alive.
 * When user closes browser/tab, heartbeat stops and pg_cron will clean up stale members.
 */
export function useHeartbeat(roomId: string, userId: string | undefined) {
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (!roomId || !userId) return;

    const supabase = supabaseRef.current;

    const sendHeartbeat = async () => {
      await supabase
        .from("room_members")
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", userId);
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then send every 30 seconds
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Also send on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, userId]);
}
