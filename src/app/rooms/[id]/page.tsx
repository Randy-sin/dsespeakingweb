"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useI18n } from "@/components/providers/i18n-provider";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  CalendarDays,
  Check,
  Circle,
  Eye,
  Users,
  ClipboardCheck,
  AlertTriangle,
  UserX,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import type { Room, Profile, RoomMember, PastPaper } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };
type RoleType = "participant" | "spectator" | "marker";

export default function WaitingRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const { t, locale } = useI18n();
  const supabase = createClient();

  // Keep membership alive with heartbeat
  useHeartbeat(roomId, user?.id);

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const startingRef = useRef(false);

  // Track departed members (were in the room but left)
  const seenMembersRef = useRef<Map<string, MemberWithProfile>>(new Map());
  const [departedMembers, setDepartedMembers] = useState<MemberWithProfile[]>([]);

  // Update departed tracking whenever members change
  useEffect(() => {
    if (loading || !room) return;

    const currentUserIds = new Set(members.map((m) => m.user_id));
    const seen = seenMembersRef.current;

    // Add all current members to "seen"
    for (const m of members) {
      seen.set(m.user_id, m);
    }

    // Compute departed: in seen but not in current (exclude self - handled separately)
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
  }, [members, loading, room, user?.id, departedMembers]);

  const fetchRoom = useCallback(async () => {
    const [{ data: roomData }, { data: memberData }] = await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).single(),
      supabase
        .from("room_members")
        .select("*, profiles(*)")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true }),
    ]);

    if (roomData) {
      setRoom(roomData);

      if (roomData.paper_id) {
        const { data: paperData } = await supabase
          .from("pastpaper_papers")
          .select("*")
          .eq("id", roomData.paper_id)
          .single();
        setPaper(paperData);
      }
    }

    if (memberData) {
      setMembers(memberData as unknown as MemberWithProfile[]);
    }
    setLoading(false);
  }, [roomId, supabase]);

  const ensureRoleSynced = useCallback(
    async (expectedRole: RoleType) => {
      if (!user?.id) return false;

      // Mobile browsers may have delayed realtime delivery.
      // Confirm role from DB before showing success state.
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await supabase
          .from("room_members")
          .select("role")
          .eq("room_id", roomId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data?.role === expectedRole) {
          // Always refresh local state so the UI updates immediately,
          // especially on mobile where realtime delivery can be delayed.
          await fetchRoom();
          return true;
        }

        await fetchRoom();
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return false;
    },
    [fetchRoom, roomId, supabase, user?.id]
  );

  useEffect(() => {
    fetchRoom();
    
    // Throttle fetchRoom to prevent excessive calls
    let fetchThrottle: ReturnType<typeof setTimeout> | null = null;
    const throttledFetch = () => {
      if (fetchThrottle) return;
      fetchThrottle = setTimeout(() => {
        fetchRoom();
        fetchThrottle = null;
      }, 300); // 300ms throttle
    };
    
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          // Direct update for rooms - faster than fetchRoom()
          setRoom(payload.new as Room);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        throttledFetch
      )
      .subscribe();

    // Listen for real-time broadcasts (nudge + ready state)
    const broadcastChannel = supabase
      .channel(`room-broadcast-${roomId}`)
      .on("broadcast", { event: "nudge" }, (payload) => {
        // Only show to non-host participants who haven't readied up
        const fromHost = payload?.payload?.from === room?.host_id;
        if (fromHost && user?.id && user.id !== room?.host_id) {
          toast("房主提醒你準備就緒！", {
            icon: "🔔",
            duration: 5000,
          });
        }
      })
      .on("broadcast", { event: "ready_update" }, (payload) => {
        // Instant ready state update via broadcast
        const newReadyVotes = payload?.payload?.ready_votes;
        if (newReadyVotes && Array.isArray(newReadyVotes)) {
          setRoom((prev) => prev ? { ...prev, ready_votes: newReadyVotes } : null);
        }
      })
      .on("broadcast", { event: "skip_update" }, (payload) => {
        // Instant skip vote update via broadcast
        const newSkipVotes = payload?.payload?.skip_votes;
        if (newSkipVotes && Array.isArray(newSkipVotes)) {
          setRoom((prev) => prev ? { ...prev, skip_votes: newSkipVotes } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
      if (fetchThrottle) clearTimeout(fetchThrottle);
    };
  }, [roomId, fetchRoom, supabase, user?.id, room?.host_id]);

  // Redirect to session if room already started and user is a member
  useEffect(() => {
    if (!room || !user?.id) return;
    if (room.status !== "waiting" && room.status !== "finished") {
      const isMemberCheck = members.some((m) => m.user_id === user.id);
      if (isMemberCheck) {
        router.push(`/rooms/${roomId}/session`);
      }
    }
  }, [room, members, user?.id, roomId, router]);

  // Detect if current user was kicked (was a member, now not found in members list)
  const wasMemberRef = useRef(false);
  useEffect(() => {
    if (!user?.id || loading) return;
    const isMemberNow = members.some((m) => m.user_id === user.id);
    if (wasMemberRef.current && !isMemberNow && room) {
      // User was in the room but now isn't — they were kicked
      toast.error(
        locale === "zh-Hant"
          ? "你已被房主移出房間"
          : "You have been removed from the room"
      );
      router.push("/rooms");
    }
    wasMemberRef.current = isMemberNow;
  }, [members, user?.id, loading, room, locale, router]);

  // Derived state
  const isHost = user?.id === room?.host_id;
  const myMember = members.find((m) => m.user_id === user?.id);
  const isMember = !!myMember;
  const myRole = myMember?.role as RoleType | undefined;
  const participants = members.filter((m) => m.role === "participant");
  const spectators = members.filter((m) => m.role === "spectator");
  const markerMember = members.find((m) => m.role === "marker");
  const hasMarker = !!markerMember;
  const memberCount = participants.length;
  const readyVotes: string[] = Array.isArray(room?.ready_votes) ? room.ready_votes : [];
  const myVoteReady = user ? readyVotes.includes(user.id) : false;
  const readyCount = readyVotes.filter((v) => participants.some((m) => m.user_id === v)).length;
  const allReady = memberCount >= 2 && readyCount === memberCount;
  const continueVotes: string[] = Array.isArray(room?.skip_votes) ? room.skip_votes : [];
  const validContinueVotes = continueVotes.filter((v) =>
    participants.some((m) => m.user_id === v)
  ).length;
  const myVoteContinue = user ? continueVotes.includes(user.id) : false;
  const allVotedContinue = memberCount >= 2 && validContinueVotes === memberCount;
  const showNoMarkerDialog = room?.status === "waiting" && allReady && !hasMarker;
  const isInSession =
    room?.status === "preparing" ||
    room?.status === "discussing" ||
    room?.status === "individual";
  const isFull = memberCount >= (room?.max_members ?? 4);
  const roleLabels: Record<RoleType, string> = {
    participant: locale === "zh-Hant" ? "參與者" : "Participant",
    spectator: locale === "zh-Hant" ? "觀眾" : "Spectator",
    marker: "Marker",
  };

  // ---- Role switching / joining ----
  const handleSelectRole = async (role: RoleType) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (switching) return;
    setSwitching(true);

    try {
      if (isMember && myRole === role) {
        // Already this role — no-op
        setSwitching(false);
        return;
      }

      // Validation
      if (role === "participant" && isInSession) {
        toast.error(
          locale === "zh-Hant"
            ? "練習已開始，無法加入為參與者"
            : "Session already started, cannot join as participant"
        );
        setSwitching(false);
        return;
      }
      if (role === "participant" && !isMember && isFull) {
        toast.error(
          locale === "zh-Hant"
            ? "參與者席位已滿"
            : "Participant seats are full"
        );
        setSwitching(false);
        return;
      }
      if (role === "participant" && isMember && myRole !== "participant" && isFull) {
        toast.error(
          locale === "zh-Hant"
            ? "參與者席位已滿"
            : "Participant seats are full"
        );
        setSwitching(false);
        return;
      }
      if (role === "marker" && hasMarker && markerMember?.user_id !== user.id) {
        toast.error("已有 Marker，每個房間只允許一位");
        setSwitching(false);
        return;
      }

      if (isMember) {
        // Switch role
        // If switching away from participant, remove ready vote
        if (myRole === "participant" && role !== "participant" && room) {
          const newVotes = readyVotes.filter((v) => v !== user.id);
          const newContinueVotes = continueVotes.filter((v) => v !== user.id);
          await supabase.from("rooms").update({ ready_votes: newVotes }).eq("id", roomId);
          await supabase.from("rooms").update({ skip_votes: newContinueVotes }).eq("id", roomId);
        }
        const { error } = await supabase
          .from("room_members")
          .update({ role: role })
          .eq("room_id", roomId)
          .eq("user_id", user.id);
        if (error) {
          toast.error("切換角色失敗");
        } else {
          const synced = await ensureRoleSynced(role);
          if (!synced) {
            toast.error(
              locale === "zh-Hant"
                ? "角色尚未同步，請稍後重試"
                : "Role update not synced yet. Please try again."
            );
            return;
          }

          toast.success(
            locale === "zh-Hant"
              ? `已切換為${roleLabels[role]}`
              : `Switched to ${roleLabels[role]}`
          );
          // If switching to spectator/marker and room is in session, go to session
          if ((role === "spectator" || role === "marker") && isInSession) {
            router.push(`/rooms/${roomId}/session`);
          }
        }
      } else {
        // Join with role
        const { error } = await supabase
          .from("room_members")
          .insert({ room_id: roomId, user_id: user.id, role });
        if (error) {
          toast.error("加入失敗");
        } else {
          const synced = await ensureRoleSynced(role);
          if (!synced) {
            toast.error(
              locale === "zh-Hant"
                ? "加入角色尚未同步，請稍後重試"
                : "Join role not synced yet. Please try again."
            );
            return;
          }

          toast.success(
            locale === "zh-Hant"
              ? `以${roleLabels[role]}身份加入`
              : `Joined as ${roleLabels[role]}`
          );
          if ((role === "spectator" || role === "marker") && isInSession) {
            router.push(`/rooms/${roomId}/session`);
          }
        }
      }
    } finally {
      setSwitching(false);
    }
  };

  // Extracted start logic
  const executeStart = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);

    try {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        await supabase
          .from("room_members")
          .update({ speaking_order: i + 1 })
          .eq("id", shuffled[i].id);
      }
      const phaseEnd = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("rooms")
        .update({
          status: "preparing",
          current_phase_end_at: phaseEnd,
          current_speaker_index: 0,
          ready_votes: [],
          skip_votes: [],
          marker_questions: {},
        })
        .eq("id", roomId)
        .eq("status", "waiting");

      if (error) {
        console.error("Auto-start failed:", error);
        toast.error("啟動失敗");
      } else {
        toast.success("全員準備就緒，練習開始！");
        router.push(`/rooms/${roomId}/session`);
      }
    } catch (err) {
      console.error("Auto-start error:", err);
      toast.error("啟動失敗");
    } finally {
      setStarting(false);
      setTimeout(() => {
        startingRef.current = false;
      }, 3000);
    }
  }, [participants, supabase, roomId, router]);

  // Auto-start when all participants are ready
  useEffect(() => {
    if (!allReady || startingRef.current || !user?.id) return;
    const triggerUserId = isHost ? room?.host_id : participants[0]?.user_id;
    if (user.id !== triggerUserId) return;

    if (!hasMarker) {
      // No marker — require unanimous participant vote to continue.
      if (!allVotedContinue) return;
      executeStart();
      return;
    }

    executeStart();
  }, [
    allReady,
    allVotedContinue,
    user?.id,
    isHost,
    room?.host_id,
    participants,
    hasMarker,
    executeStart,
  ]);

  const handleToggleNoMarkerContinueVote = async () => {
    if (!user || !room || myRole !== "participant") return;
    const currentVotes: string[] = Array.isArray(room.skip_votes) ? room.skip_votes : [];

    let newVotes: string[];
    if (myVoteContinue) {
      newVotes = currentVotes.filter((v) => v !== user.id);
    } else {
      newVotes = [...currentVotes.filter((v) => v !== user.id), user.id];
    }

    // Optimistic update
    setRoom({ ...room, skip_votes: newVotes });
    
    const { error } = await supabase
      .from("rooms")
      .update({ skip_votes: newVotes })
      .eq("id", roomId)
      .eq("status", "waiting");

    if (error) {
      toast.error(locale === "zh-Hant" ? "投票失敗，請重試" : "Vote failed, please retry");
      setRoom({ ...room, skip_votes: currentVotes });
      return;
    }

    // Broadcast to all clients for instant update
    const channel = supabase.channel(`room-broadcast-${roomId}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "skip_update",
      payload: { skip_votes: newVotes },
    });
    supabase.removeChannel(channel);

    if (!myVoteContinue) {
      toast.success(locale === "zh-Hant" ? "已投票同意繼續" : "Voted to continue");
    }
  };

  const handleToggleReady = async () => {
    if (!user || !room) return;
    const currentVotes: string[] = Array.isArray(room.ready_votes) ? room.ready_votes : [];

    let newVotes: string[];
    if (myVoteReady) {
      newVotes = currentVotes.filter((v) => v !== user.id);
    } else {
      newVotes = [...currentVotes.filter((v) => v !== user.id), user.id];
    }

    // Optimistic update
    setRoom({ ...room, ready_votes: newVotes });

    const { error } = await supabase
      .from("rooms")
      .update({ ready_votes: newVotes })
      .eq("id", roomId);

    if (error) {
      console.error("Toggle ready failed:", error);
      toast.error("操作失敗，請重試");
      setRoom({ ...room, ready_votes: currentVotes });
    } else {
      // Broadcast to all clients for instant update
      const channel = supabase.channel(`room-broadcast-${roomId}`);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "ready_update",
        payload: { ready_votes: newVotes },
      });
      supabase.removeChannel(channel);
      
      if (!myVoteReady) {
        toast.success("已準備");
      }
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    if (isHost) {
      await supabase.from("rooms").delete().eq("id", roomId);
      toast.success("房間已解散");
    } else {
      if (room) {
        const newVotes = (Array.isArray(room.ready_votes) ? room.ready_votes : []).filter(
          (v) => v !== user.id
        );
        const newContinueVotes = (Array.isArray(room.skip_votes) ? room.skip_votes : []).filter(
          (v) => v !== user.id
        );
        await supabase
          .from("rooms")
          .update({ ready_votes: newVotes, skip_votes: newContinueVotes })
          .eq("id", roomId);
      }
      await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);
      toast.success("已離開房間");
    }
    router.push("/rooms");
  };

  // ---- Host: Kick member ----
  const handleKick = async (targetUserId: string, targetName: string) => {
    if (!user || !isHost || targetUserId === user.id) return;

    // Remove from votes
    if (room) {
      const newReadyVotes = readyVotes.filter((v) => v !== targetUserId);
      const newContinueVotes = continueVotes.filter((v) => v !== targetUserId);
      await supabase
        .from("rooms")
        .update({ ready_votes: newReadyVotes, skip_votes: newContinueVotes })
        .eq("id", roomId);
    }

    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", targetUserId);

    if (error) {
      toast.error(locale === "zh-Hant" ? "移除失敗" : "Failed to remove");
    } else {
      toast.success(
        locale === "zh-Hant"
          ? `已將 ${targetName} 移出房間`
          : `Removed ${targetName} from room`
      );
      await fetchRoom();
    }
  };

  // ---- Host: Nudge unready participants ----
  const [nudgeCooldown, setNudgeCooldown] = useState(false);
  const handleNudge = async () => {
    if (!isHost || nudgeCooldown) return;
    setNudgeCooldown(true);

    // Broadcast a nudge event via Supabase Realtime
    const channel = supabase.channel(`nudge-${roomId}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "nudge",
      payload: { from: user?.id },
    });
    supabase.removeChannel(channel);

    toast.success(
      locale === "zh-Hant" ? "已提醒未準備的成員" : "Reminded unready members"
    );

    // 15s cooldown to prevent spam
    setTimeout(() => setNudgeCooldown(false), 15000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <p className="text-[15px] text-neutral-900 mb-1">房間不存在</p>
          <p className="text-[13px] text-neutral-400 mb-6">
            這個房間可能已經被解散了
          </p>
          <Link href="/rooms">
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] h-9 rounded-full px-5">
              返回
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Role selector tab config
  const roleConfig: {
    role: RoleType;
    label: string;
    icon: React.ReactNode;
    count: string;
    disabled: boolean;
    disabledReason?: string;
  }[] = [
    {
      role: "participant",
      label: roleLabels.participant,
      icon: <Users className="h-3.5 w-3.5" />,
      count: `${memberCount}/${room.max_members}`,
      disabled: (isInSession && myRole !== "participant") || (!isMember && isFull && !isInSession),
      disabledReason: isInSession
        ? locale === "zh-Hant"
          ? "練習中"
          : "In session"
        : locale === "zh-Hant"
        ? "已滿"
        : "Full",
    },
    {
      role: "spectator",
      label: roleLabels.spectator,
      icon: <Eye className="h-3.5 w-3.5" />,
      count: `${spectators.length}`,
      disabled: false,
    },
    {
      role: "marker",
      label: "Marker",
      icon: <ClipboardCheck className="h-3.5 w-3.5" />,
      count: hasMarker ? "1/1" : "0/1",
      disabled: hasMarker && markerMember?.user_id !== user?.id,
      disabledReason: locale === "zh-Hant" ? "已佔用" : "Occupied",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        <Link
          href="/rooms"
          className="inline-flex items-center text-[13px] text-neutral-400 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          返回
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-[28px] font-semibold text-neutral-900 tracking-tight">
              {room.name}
            </h1>
            <span className="text-[12px] text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
              {memberCount}/{room.max_members}
            </span>
          </div>
          {room.scheduled_at ? (
            <div className="flex items-center gap-2 text-[14px] text-neutral-500 mt-1">
              <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
              <span>
                計劃於{" "}
                <span className="font-medium text-neutral-700">
                  {format(new Date(room.scheduled_at), "M月d日 EEEE HH:mm", {
                    locale: zhTW,
                  })}
                </span>{" "}
                開始
              </span>
            </div>
          ) : (
            <p className="text-[14px] text-neutral-400">等待隊友加入...</p>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Left column: Members + Role Selector */}
          <div className="lg:col-span-3 space-y-6">

            {/* Role Selector Tabs */}
            <div className="flex rounded-lg border border-neutral-200/60 overflow-hidden">
              {roleConfig.map((cfg) => {
                const isActive = myRole === cfg.role;
                const isDisabled = cfg.disabled && !isActive;
                return (
                  <button
                    key={cfg.role}
                    type="button"
                    disabled={isDisabled || switching}
                    onClick={() => handleSelectRole(cfg.role)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-[13px] font-medium transition-all border-r last:border-r-0 border-neutral-200/60 ${
                      isActive
                        ? cfg.role === "marker"
                          ? "bg-violet-50 text-violet-700 border-b-2 border-b-violet-500"
                          : cfg.role === "spectator"
                          ? "bg-blue-50 text-blue-700 border-b-2 border-b-blue-500"
                          : "bg-neutral-900 text-white"
                        : isDisabled
                        ? "bg-neutral-50 text-neutral-300 cursor-not-allowed"
                        : "bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 cursor-pointer"
                    }`}
                  >
                    {cfg.icon}
                    <span>{cfg.label}</span>
                    <span className={`text-[11px] font-mono ${isActive ? "opacity-70" : "text-neutral-300"}`}>
                      {cfg.count}
                    </span>
                    {isDisabled && cfg.disabledReason && (
                      <span className="text-[10px] text-neutral-300 ml-0.5">
                        ({cfg.disabledReason})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Participant Seats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide">
                  Participants
                </p>
                {memberCount >= 2 && (
                  <span className="text-[12px] text-neutral-400">
                    {readyCount}/{memberCount} 已準備
                  </span>
                )}
              </div>

              {/* Ready progress bar */}
              {memberCount >= 2 && (
                <div className="h-1.5 rounded-full bg-neutral-100 mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${(readyCount / memberCount) * 100}%`,
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                {Array.from({ length: room.max_members }).map((_, i) => {
                  const member = participants[i];
                  const isSlotHost = member?.user_id === room.host_id;
                  const isReady = member
                    ? readyVotes.includes(member.user_id)
                    : false;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                        member
                          ? isReady
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-neutral-200/60 bg-white"
                          : "border-dashed border-neutral-200 bg-neutral-50/50"
                      }`}
                    >
                      {member ? (
                        <>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback
                              className={`text-[11px] font-medium ${
                                isSlotHost
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {member.profiles?.display_name
                                ?.slice(0, 2)
                                ?.toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-neutral-900 truncate">
                              {member.profiles?.display_name || "匿名"}
                            </p>
                            <p className="text-[12px] text-neutral-400">
                              Level {member.profiles?.speaking_level || 3}
                              {isSlotHost && " · 房主"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isReady ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <Check className="h-4 w-4" />
                                <span className="text-[12px] font-medium">
                                  已準備
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-neutral-300">
                                <Circle className="h-4 w-4" />
                                <span className="text-[12px]">等待中</span>
                              </div>
                            )}
                            {/* Host kick button */}
                            {isHost && !isSlotHost && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleKick(
                                    member.user_id,
                                    member.profiles?.display_name || "匿名"
                                  )
                                }
                                className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title={locale === "zh-Hant" ? "移出房間" : "Remove"}
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 text-neutral-400">
                          <div className="w-9 h-9 rounded-full border border-dashed border-neutral-200" />
                          <span className="text-[13px]">等待加入</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Departed participants */}
                {departedMembers
                  .filter((d) => d.role === "participant")
                  .map((departed) => (
                    <div
                      key={`departed-${departed.user_id}`}
                      className="flex items-center gap-3 p-3.5 rounded-lg border border-red-100 bg-red-50/30 opacity-60"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-[11px] font-medium bg-neutral-200 text-neutral-400">
                          {departed.profiles?.display_name
                            ?.slice(0, 2)
                            ?.toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-neutral-400 truncate line-through">
                          {departed.profiles?.display_name || "匿名"}
                        </p>
                        <p className="text-[12px] text-neutral-300">
                          Level {departed.profiles?.speaking_level || 3}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-medium">已退出</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Marker Seat */}
            <div>
              <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                Marker
              </p>
              <div
                className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                  hasMarker
                    ? "border-violet-200 bg-violet-50/50"
                    : "border-dashed border-neutral-200 bg-neutral-50/50"
                }`}
              >
                {markerMember ? (
                  <>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-[11px] font-medium bg-violet-600 text-white">
                        {markerMember.profiles?.display_name
                          ?.slice(0, 2)
                          ?.toUpperCase() || "MK"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-neutral-900 truncate">
                        {markerMember.profiles?.display_name || "Marker"}
                      </p>
                      <p className="text-[12px] text-violet-500">
                        {locale === "zh-Hant" ? "評分員" : "Marker"}
                        {markerMember.user_id === room.host_id && " · 房主"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-violet-500" />
                      {isHost && markerMember.user_id !== room.host_id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleKick(
                              markerMember.user_id,
                              markerMember.profiles?.display_name || "Marker"
                            )
                          }
                          className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title={locale === "zh-Hant" ? "移出房間" : "Remove"}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-neutral-400">
                    <div className="w-9 h-9 rounded-full border border-dashed border-violet-200 flex items-center justify-center">
                      <ClipboardCheck className="h-4 w-4 text-violet-300" />
                    </div>
                    <span className="text-[13px]">
                      {locale === "zh-Hant"
                        ? "等待 Marker 加入"
                        : "Waiting for Marker to join"}
                    </span>
                  </div>
                )}
              </div>

              {/* Departed marker */}
              {!markerMember &&
                departedMembers
                  .filter((d) => d.role === "marker")
                  .map((departed) => (
                    <div
                      key={`departed-marker-${departed.user_id}`}
                      className="mt-2 flex items-center gap-3 p-3.5 rounded-lg border border-red-100 bg-red-50/30 opacity-60"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-[11px] font-medium bg-neutral-200 text-neutral-400">
                          {departed.profiles?.display_name
                            ?.slice(0, 2)
                            ?.toUpperCase() || "MK"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-neutral-400 truncate line-through">
                          {departed.profiles?.display_name || "Marker"}
                        </p>
                        <p className="text-[12px] text-neutral-300">Marker</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-medium">已退出</span>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Spectators */}
            {(spectators.length > 0 || departedMembers.some((d) => d.role === "spectator")) && (
              <div>
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                  {locale === "zh-Hant"
                    ? `觀眾 (${spectators.length})`
                    : `Spectators (${spectators.length})`}
                </p>
                <div className="space-y-1.5">
                  {spectators.map((spec) => {
                    const isSpecHost = spec.user_id === room.host_id;
                    return (
                      <div
                        key={spec.id}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] font-medium bg-blue-50 text-blue-600">
                            {spec.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-neutral-700 truncate">
                            {spec.profiles?.display_name || "匿名"}
                            {isSpecHost && (
                              <span className="text-[11px] text-neutral-400 ml-1">· 房主</span>
                            )}
                          </p>
                        </div>
                        <Eye className="h-3 w-3 text-neutral-300" />
                        {isHost && !isSpecHost && (
                          <button
                            type="button"
                            onClick={() =>
                              handleKick(
                                spec.user_id,
                                spec.profiles?.display_name || "匿名"
                              )
                            }
                            className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title={locale === "zh-Hant" ? "移出房間" : "Remove"}
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Departed spectators */}
                  {departedMembers
                    .filter((d) => d.role === "spectator")
                    .map((departed) => (
                      <div
                        key={`departed-spec-${departed.user_id}`}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-red-100 bg-red-50/30 opacity-60"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] font-medium bg-neutral-200 text-neutral-400">
                            {departed.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-neutral-400 truncate line-through">
                            {departed.profiles?.display_name || "匿名"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <LogOut className="h-3 w-3" />
                          <span className="text-[11px]">已退出</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Host nudge button — show when there are unready participants */}
              {isHost && memberCount >= 2 && readyCount < memberCount && (
                <Button
                  variant="outline"
                  onClick={handleNudge}
                  disabled={nudgeCooldown}
                  className="h-9 text-[13px] border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 w-full"
                >
                  <Bell className="mr-1.5 h-3.5 w-3.5" />
                  {nudgeCooldown
                    ? locale === "zh-Hant"
                      ? "已提醒（冷卻中）"
                      : "Reminded (cooldown)"
                    : locale === "zh-Hant"
                    ? `提醒準備 (${memberCount - readyCount} 人未準備)`
                    : `Remind (${memberCount - readyCount} unready)`}
                </Button>
              )}

              <div className="flex gap-2">
                {isMember && myRole === "participant" ? (
                  <>
                    <Button
                      onClick={handleToggleReady}
                      className={`flex-1 h-10 text-[14px] transition-all ${
                        myVoteReady
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : memberCount < 2
                            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white"
                      }`}
                      disabled={memberCount < 2 || starting}
                    >
                      {starting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : myVoteReady ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : null}
                      {starting
                      ? "正在開始..."
                        : memberCount < 2
                          ? "至少需要 2 人"
                          : myVoteReady
                            ? allReady
                              ? "全員準備就緒！"
                              : `已準備 (${readyCount}/${memberCount})`
                            : "準備好了"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLeave}
                      className="h-10 text-[13px] text-neutral-400 hover:text-neutral-900"
                    >
                      <LogOut className="mr-1.5 h-3.5 w-3.5" />
                      {isHost ? "解散" : "離開"}
                    </Button>
                  </>
                ) : isMember ? (
                  <>
                    {isInSession ? (
                      <Button
                        onClick={() => router.push(`/rooms/${roomId}/session`)}
                        className="flex-1 h-10 text-[14px] bg-neutral-900 hover:bg-neutral-800 text-white"
                      >
                        進入練習
                      </Button>
                    ) : (
                      <p className="text-[13px] text-neutral-400 py-2">
                        {myRole === "marker"
                          ? locale === "zh-Hant"
                            ? "等待參與者準備就緒後自動開始"
                            : "Waiting for participants to get ready..."
                          : locale === "zh-Hant"
                          ? "等待練習開始..."
                          : "Waiting for session to start..."}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      onClick={handleLeave}
                      className="h-10 text-[13px] text-neutral-400 hover:text-neutral-900"
                    >
                      <LogOut className="mr-1.5 h-3.5 w-3.5" />
                      {isHost ? "解散" : "離開"}
                    </Button>
                  </>
                ) : (
                  <p className="text-[13px] text-neutral-400 py-2">
                    {locale === "zh-Hant"
                      ? "選擇上方角色加入房間"
                      : "Choose a role above to join"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Topic Preview — only show topic name, hide specific questions */}
          <div className="lg:col-span-2">
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-4">
              Topic
            </p>
            {paper ? (
              <div className="border border-neutral-200/60 rounded-lg p-5 space-y-4">
                <div>
                  <p className="text-[12px] text-neutral-400 mb-1">
                    {paper.year} · {paper.paper_number}
                  </p>
                  <p className="text-[15px] font-medium text-neutral-900 leading-relaxed">
                    {paper.topic}
                  </p>
                </div>
                <Separator className="bg-neutral-100" />
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-neutral-400" />
                  </div>
                  <p className="text-[13px] text-neutral-400 leading-relaxed">
                    {locale === "zh-Hant"
                      ? "具體討論題目將在練習開始後的準備階段顯示"
                      : "Discussion questions will be revealed during the preparation phase"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">
                {locale === "zh-Hant" ? "未選擇題目" : "No topic selected"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* No Marker confirmation dialog (shared for everyone) */}
      <Dialog open={showNoMarkerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {locale === "zh-Hant" ? "目前沒有 Marker" : "No Marker Present"}
            </DialogTitle>
            <DialogDescription>
              {locale === "zh-Hant"
                ? "所有參與者已準備就緒，但沒有 Marker（評分員）加入。沒有 Marker 將無法獲得評分和 Part B 考官提問體驗。是否要繼續開始練習？"
                : "All participants are ready, but no Marker (examiner) has joined. Without a Marker you will not receive scoring or Part B examiner questions. Continue anyway?"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-amber-200/70 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
            {locale === "zh-Hant"
              ? `目前同意票：${validContinueVotes}/${memberCount}（需全體參與者同意）`
              : `Current votes: ${validContinueVotes}/${memberCount} (unanimous participants required)`}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {myRole === "participant" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (myVoteContinue) {
                      handleToggleNoMarkerContinueVote();
                    }
                  }}
                  className="sm:flex-1"
                >
                  {locale === "zh-Hant" ? "等待 Marker" : "Wait for Marker"}
                </Button>
                <Button
                  onClick={handleToggleNoMarkerContinueVote}
                  className="sm:flex-1 bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  {myVoteContinue
                    ? locale === "zh-Hant"
                      ? "已投票同意"
                      : "Voted to continue"
                    : locale === "zh-Hant"
                    ? "投票同意繼續"
                    : "Vote to continue"}
                </Button>
              </>
            ) : (
              <p className="text-[12px] text-neutral-500 w-full text-center py-1">
                {locale === "zh-Hant"
                  ? "只有參與者可以投票，請等待投票結果。"
                  : "Only participants can vote. Please wait for the result."}
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
