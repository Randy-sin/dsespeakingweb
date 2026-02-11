"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Room, Profile, RoomMember, PastPaper } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

const DISCUSSION_DURATION = 8 * 60; // 8 minutes in seconds
const COUNTDOWN_SECONDS = 3; // 3-2-1 countdown

export default function SessionPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const phaseTransitionRef = useRef(false);
  const micsReadyRef = useRef(false);

  // Separate participants from spectators
  const participants = allMembers.filter((m) => m.role !== "spectator");
  const spectators = allMembers.filter((m) => m.role === "spectator");

  // Detect if current user is a spectator
  const myMembership = allMembers.find((m) => m.user_id === user?.id);
  const isSpectator = myMembership?.role === "spectator";

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
    setLoading(false);
  }, [roomId, supabase]);

  useEffect(() => {
    fetchData();
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
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchData, supabase]);

  const { timeLeft, isExpired } = useCountdown(room?.current_phase_end_at ?? null);

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

  // Reset micsReadyRef when we enter a new "waiting for mics" state
  useEffect(() => {
    if (isWaitingForMics) {
      micsReadyRef.current = false;
    }
  }, [isWaitingForMics]);

  // Called by MediaControls when all participants have their mic on
  const handleAllMicsReady = useCallback(async () => {
    if (micsReadyRef.current || isSpectator || !room) return;
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
  }, [isSpectator, room, roomId, supabase]);

  // Manual override: start discussion without waiting for all mics
  const handleManualStartDiscussion = useCallback(async () => {
    if (isSpectator || !room) return;
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

    toast.success("讨论即将开始");
  }, [isSpectator, room, roomId, supabase]);

  // ---- Phase transition (any PARTICIPANT can trigger when timer expires) ----
  useEffect(() => {
    if (!isExpired || !room || phaseTransitionRef.current || isSpectator) return;

    const transitionPhase = async () => {
      phaseTransitionRef.current = true;

      if (room.status === "preparing") {
        // Transition to discussing: set current_phase_end_at = null (wait for mics)
        await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null, // Timer NOT started yet — wait for all mics
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");
        toast("进入讨论阶段 — 请开启麦克风");
      } else if (room.status === "discussing") {
        const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
        await supabase
          .from("rooms")
          .update({
            status: "individual",
            current_phase_end_at: phaseEnd,
            current_speaker_index: 0,
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "discussing");
        toast("进入个人回应阶段");
      } else if (room.status === "individual") {
        const nextIndex = (room.current_speaker_index ?? 0) + 1;
        if (nextIndex < participants.length) {
          const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
          await supabase
            .from("rooms")
            .update({
              current_phase_end_at: phaseEnd,
              current_speaker_index: nextIndex,
              skip_votes: [],
            })
            .eq("id", roomId);
        } else {
          await supabase
            .from("rooms")
            .update({
              status: "finished",
              current_phase_end_at: null,
              current_speaker_index: null,
              skip_votes: [],
            })
            .eq("id", roomId);
          toast("练习完成");
        }
      }

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 2000);
    };

    transitionPhase();
  }, [isExpired, room, participants.length, roomId, supabase, isSpectator]);

  // ---- Voting to skip current phase (participants only) ----
  const skipVotes = room?.skip_votes ?? [];
  const myVoteSkip = user ? skipVotes.includes(user.id) : false;
  const validSkipVotes = skipVotes.filter((v) =>
    participants.some((m) => m.user_id === v)
  ).length;
  const allVotedSkip =
    participants.length >= 2 && validSkipVotes === participants.length;

  // Auto-execute skip when all participants voted
  useEffect(() => {
    if (!allVotedSkip || !room || phaseTransitionRef.current || isSpectator)
      return;

    const executeSkip = async () => {
      phaseTransitionRef.current = true;

      if (room.status === "preparing") {
        // Skip to discussing: set current_phase_end_at = null (wait for mics)
        await supabase
          .from("rooms")
          .update({
            status: "discussing",
            current_phase_end_at: null, // Timer NOT started — wait for mics
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "preparing");
        toast.success("全员同意，跳过准备阶段 — 请开启麦克风");
      } else if (room.status === "discussing") {
        const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
        await supabase
          .from("rooms")
          .update({
            status: "individual",
            current_phase_end_at: phaseEnd,
            current_speaker_index: 0,
            skip_votes: [],
          })
          .eq("id", roomId)
          .eq("status", "discussing");
        toast.success("全员同意，跳过讨论阶段");
      }

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 2000);
    };

    executeSkip();
  }, [allVotedSkip, room, roomId, supabase, isSpectator]);

  const handleToggleSkipVote = async () => {
    if (!user || !room || isSpectator) return;
    const currentVotes = room.skip_votes ?? [];

    if (myVoteSkip) {
      const newVotes = currentVotes.filter((v) => v !== user.id);
      await supabase
        .from("rooms")
        .update({ skip_votes: newVotes })
        .eq("id", roomId);
    } else {
      const newVotes = [...currentVotes.filter((v) => v !== user.id), user.id];
      await supabase
        .from("rooms")
        .update({ skip_votes: newVotes })
        .eq("id", roomId);
      toast.success("已投票跳过");
    }
  };

  const handleLeaveSpectator = async () => {
    if (!user) return;
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);
    toast.success("已退出观看");
    router.push("/rooms");
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
          <p className="text-[14px] text-neutral-400 mb-4">房间或题目不存在</p>
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
  const partBQuestions =
    (paper.part_b_questions as { question: string }[]) || [];

  const canVoteSkip =
    !isSpectator &&
    (room.status === "preparing" ||
      (room.status === "discussing" && room.current_phase_end_at !== null));

  // Timer display label
  const timerLabel = isWaitingForMics
    ? "Mic Check"
    : room.status === "preparing"
      ? "Prep"
      : room.status === "discussing"
        ? "Discussion"
        : room.status === "individual"
          ? `Individual ${currentSpeakerIndex + 1}/${participants.length}`
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
                观众模式
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
      {isWaitingForMics && !isSpectator && (
        <div className="bg-amber-50/80 border-b border-amber-200/60">
          <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Mic className="h-4 w-4 text-amber-600 animate-pulse" />
              </div>
              <div>
                <p className="text-[13px] text-amber-900 font-medium">
                  等待所有参与者开启麦克风
                </p>
                <p className="text-[11px] text-amber-600">
                  所有人麦克风就绪后自动开始 3-2-1 倒数
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[12px] border-amber-300 text-amber-700 hover:bg-amber-100 h-8"
              onClick={handleManualStartDiscussion}
            >
              跳过等待，直接开始
            </Button>
          </div>
        </div>
      )}

      {/* Spectator banner */}
      {isSpectator && room.status !== "finished" && (
        <div className="bg-blue-50/60 border-b border-blue-100/60">
          <div className="max-w-7xl mx-auto px-5 py-2 flex items-center justify-between">
            <p className="text-[12px] text-blue-600">
              你正在以观众身份观看此练习。可以看到题目和听到讨论，但不能参与互动。
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px] text-blue-500 hover:text-blue-700 h-7"
              onClick={handleLeaveSpectator}
            >
              <LogOut className="mr-1 h-3 w-3" />
              退出观看
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 py-6">
        {/* Finished */}
        {room.status === "finished" && (
          <div className="text-center py-20">
            <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-4">
              Session Complete
            </p>
            <h2 className="font-serif text-[32px] font-semibold text-neutral-900 tracking-tight mb-3">
              练习完成
            </h2>
            <p className="text-[15px] text-neutral-400 mb-10 max-w-md mx-auto">
              {isSpectator
                ? "你观看的 DSE Speaking 模拟练习已经结束。"
                : "你完成了一次完整的 DSE Speaking 模拟练习。回顾讨论中的表现，持续进步。"}
            </p>
            <Link href="/rooms">
              <Button className="h-10 px-6 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-full">
                <Home className="mr-2 h-4 w-4" />
                返回
              </Button>
            </Link>
          </div>
        )}

        {/* Active */}
        {room.status !== "finished" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
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

                {/* Article */}
                <div className="border border-neutral-200/60 rounded-lg p-6 mb-6">
                  <div className="text-[14px] text-neutral-600 leading-[1.75] space-y-3">
                    {paper.part_a_article?.map(
                      (paragraph: string, idx: number) => (
                        <p key={idx}>{paragraph}</p>
                      )
                    )}
                  </div>
                </div>

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
                      Individual Response
                    </p>
                    <div className="border border-neutral-200/60 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-neutral-900 text-white text-[11px]">
                            {currentSpeaker?.profiles?.display_name
                              ?.slice(0, 2)
                              ?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[14px] font-medium text-neutral-900">
                            {currentSpeaker?.profiles?.display_name ||
                              "Speaker"}
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            {isCurrentSpeaker
                              ? "轮到你了"
                              : "正在回答"}
                          </p>
                        </div>
                      </div>
                      {partBQuestions[currentSpeakerIndex] && (
                        <p className="text-[14px] text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded border border-neutral-100">
                          {typeof partBQuestions[currentSpeakerIndex] ===
                          "string"
                            ? partBQuestions[currentSpeakerIndex]
                            : (
                                partBQuestions[currentSpeakerIndex] as {
                                  question: string;
                                }
                              )?.question ||
                              JSON.stringify(
                                partBQuestions[currentSpeakerIndex]
                              )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes (participants only) */}
              {room.status === "preparing" && !isSpectator && (
                <div>
                  <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                    Notes
                  </p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="整理你的观点、要点和关键词..."
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
                    waitingForMics={isWaitingForMics}
                    expectedParticipantCount={participants.length}
                    onAllMicsReady={handleAllMicsReady}
                  />
                </div>
              </div>

              {/* Participants */}
              <div>
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                  Participants ({participants.length})
                </p>
                <div className="space-y-1">
                  {participants.map((member, idx) => {
                    const isSpeaking =
                      room.status === "individual" &&
                      idx === currentSpeakerIndex;
                    const memberIsHost = member.user_id === room.host_id;
                    const hasVotedSkip =
                      canVoteSkip && skipVotes.includes(member.user_id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-colors ${
                          isSpeaking
                            ? "bg-neutral-50 border border-neutral-200"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback
                            className={`text-[10px] font-medium ${
                              isSpeaking
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
                          <p className="text-[13px] font-medium text-neutral-900 truncate">
                            {member.profiles?.display_name || "匿名"}
                            {member.user_id === user?.id && (
                              <span className="text-neutral-400 font-normal">
                                {" "}
                                (你)
                              </span>
                            )}
                          </p>
                        </div>
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spectators */}
              {spectators.length > 0 && (
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
                  </div>
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
                          跳过投票
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
                        已投票跳过
                        {!allVotedSkip && (
                          <span className="ml-1 text-[11px] opacity-70">
                            ({validSkipVotes}/{participants.length})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                        跳过
                        {room.status === "preparing" ? "准备" : "讨论"}阶段
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-neutral-300 mt-2 text-center">
                    需要全部参与者同意才能跳过
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
