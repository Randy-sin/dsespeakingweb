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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Room, Profile, RoomMember, PastPaper } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

export default function SessionPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const phaseTransitionRef = useRef(false);

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
      setMembers(memberData as unknown as MemberWithProfile[]);
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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchData, supabase]);

  const { isExpired } = useCountdown(room?.current_phase_end_at ?? null);
  const isHost = user?.id === room?.host_id;

  useEffect(() => {
    if (!isExpired || !isHost || !room || phaseTransitionRef.current) return;

    const transitionPhase = async () => {
      phaseTransitionRef.current = true;

      if (room.status === "preparing") {
        const discussionMinutes = members.length >= 4 ? 8 : 6;
        const phaseEnd = new Date(Date.now() + discussionMinutes * 60 * 1000).toISOString();
        await supabase
          .from("rooms")
          .update({ status: "discussing", current_phase_end_at: phaseEnd })
          .eq("id", roomId);
        toast("进入讨论阶段");
      } else if (room.status === "discussing") {
        const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
        await supabase
          .from("rooms")
          .update({ status: "individual", current_phase_end_at: phaseEnd, current_speaker_index: 0 })
          .eq("id", roomId);
        toast("进入个人回应阶段");
      } else if (room.status === "individual") {
        const nextIndex = (room.current_speaker_index ?? 0) + 1;
        if (nextIndex < members.length) {
          const phaseEnd = new Date(Date.now() + 1 * 60 * 1000).toISOString();
          await supabase
            .from("rooms")
            .update({ current_phase_end_at: phaseEnd, current_speaker_index: nextIndex })
            .eq("id", roomId);
        } else {
          await supabase
            .from("rooms")
            .update({ status: "finished", current_phase_end_at: null, current_speaker_index: null })
            .eq("id", roomId);
          toast("练习完成");
        }
      }

      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 2000);
    };

    transitionPhase();
  }, [isExpired, isHost, room, members.length, roomId, supabase]);

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
  const currentSpeaker = members[currentSpeakerIndex];
  const isCurrentSpeaker = user?.id === currentSpeaker?.user_id;
  const partBQuestions = (paper.part_b_questions as { question: string }[]) || [];

  return (
    <div className="min-h-screen bg-white">
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
          <TimerDisplay
            targetDate={room.current_phase_end_at}
            label={
              room.status === "preparing"
                ? "Prep"
                : room.status === "discussing"
                  ? "Discussion"
                  : room.status === "individual"
                    ? `Individual ${currentSpeakerIndex + 1}/${members.length}`
                    : "Done"
            }
          />
        </div>
      </div>

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
              你完成了一次完整的 DSE Speaking 模拟练习。回顾讨论中的表现，持续进步。
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
                {(room.status === "preparing" || room.status === "discussing") && (
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
                            {currentSpeaker?.profiles?.display_name || "Speaker"}
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            {isCurrentSpeaker ? "轮到你了" : "正在回答"}
                          </p>
                        </div>
                      </div>
                      {partBQuestions[currentSpeakerIndex] && (
                        <p className="text-[14px] text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded border border-neutral-100">
                          {typeof partBQuestions[currentSpeakerIndex] === "string"
                            ? partBQuestions[currentSpeakerIndex]
                            : (partBQuestions[currentSpeakerIndex] as { question: string })?.question ||
                              JSON.stringify(partBQuestions[currentSpeakerIndex])}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {room.status === "preparing" && (
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
                  />
                </div>
              </div>

              {/* Members */}
              <div>
                <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                  Members ({members.length})
                </p>
                <div className="space-y-1">
                  {members.map((member, idx) => {
                    const isSpeaking =
                      room.status === "individual" && idx === currentSpeakerIndex;
                    const memberIsHost = member.user_id === room.host_id;
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
                                {" "}(你)
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Host Controls */}
              {isHost && (
                <div>
                  <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-3">
                    Controls
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[13px] border-neutral-200 text-neutral-500 hover:text-neutral-900"
                    onClick={async () => {
                      if (room.status === "preparing") {
                        const discussionMinutes = members.length >= 4 ? 8 : 6;
                        const phaseEnd = new Date(
                          Date.now() + discussionMinutes * 60 * 1000
                        ).toISOString();
                        await supabase
                          .from("rooms")
                          .update({ status: "discussing", current_phase_end_at: phaseEnd })
                          .eq("id", roomId);
                        toast("跳过准备阶段");
                      } else if (room.status === "discussing") {
                        const phaseEnd = new Date(
                          Date.now() + 1 * 60 * 1000
                        ).toISOString();
                        await supabase
                          .from("rooms")
                          .update({
                            status: "individual",
                            current_phase_end_at: phaseEnd,
                            current_speaker_index: 0,
                          })
                          .eq("id", roomId);
                        toast("跳过讨论阶段");
                      }
                    }}
                  >
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                    跳过当前阶段
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
