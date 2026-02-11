"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Play,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import type { Room, Profile, RoomMember, PastPaper } from "@/lib/supabase/types";

type MemberWithProfile = RoomMember & { profiles: Profile };

export default function WaitingRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [paper, setPaper] = useState<PastPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const fetchRoom = useCallback(async () => {
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomData) {
      setRoom(roomData);
      if (roomData.status !== "waiting" && roomData.status !== "finished") {
        router.push(`/rooms/${roomId}/session`);
        return;
      }
      if (roomData.paper_id) {
        const { data: paperData } = await supabase
          .from("pastpaper_papers")
          .select("*")
          .eq("id", roomData.paper_id)
          .single();
        setPaper(paperData);
      }
    }

    const { data: memberData } = await supabase
      .from("room_members")
      .select("*, profiles(*)")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (memberData) {
      setMembers(memberData as unknown as MemberWithProfile[]);
    }
    setLoading(false);
  }, [roomId, router, supabase]);

  useEffect(() => {
    fetchRoom();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => fetchRoom()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => fetchRoom()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchRoom, supabase]);

  const isHost = user?.id === room?.host_id;
  const isMember = members.some((m) => m.user_id === user?.id);
  const memberCount = members.length;
  const canStart = isHost && memberCount >= 2;

  const handleStart = async () => {
    if (!canStart) return;
    setStarting(true);
    try {
      const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffledMembers.length; i++) {
        await supabase
          .from("room_members")
          .update({ speaking_order: i + 1 })
          .eq("id", shuffledMembers[i].id);
      }
      const phaseEnd = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase
        .from("rooms")
        .update({ status: "preparing", current_phase_end_at: phaseEnd, current_speaker_index: 0 })
        .eq("id", roomId);
      toast.success("练习开始");
      router.push(`/rooms/${roomId}/session`);
    } catch {
      toast.error("启动失败");
    } finally {
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    if (isHost) {
      await supabase.from("rooms").delete().eq("id", roomId);
      toast.success("房间已解散");
    } else {
      await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);
      toast.success("已离开房间");
    }
    router.push("/rooms");
  };

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase
      .from("room_members")
      .insert({ room_id: roomId, user_id: user.id });
    if (error) toast.error("加入失败");
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
          <p className="text-[15px] text-neutral-900 mb-1">房间不存在</p>
          <p className="text-[13px] text-neutral-400 mb-6">
            这个房间可能已经被解散了
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
                计划于{" "}
                <span className="font-medium text-neutral-700">
                  {format(new Date(room.scheduled_at), "M月d日 EEEE HH:mm", { locale: zhCN })}
                </span>{" "}
                开始
              </span>
            </div>
          ) : (
            <p className="text-[14px] text-neutral-400">等待队友加入...</p>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Members */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <p className="text-[13px] text-neutral-400 uppercase tracking-wide mb-4">
                Members
              </p>
              <div className="space-y-2">
                {Array.from({ length: room.max_members }).map((_, i) => {
                  const member = members[i];
                  const isSlotHost = member?.user_id === room.host_id;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                        member
                          ? "border-neutral-200/60 bg-white"
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
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isHost ? (
                <>
                  <Button
                    onClick={handleStart}
                    className="flex-1 h-10 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px]"
                    disabled={!canStart || starting}
                  >
                    {starting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {canStart
                      ? "开始练习"
                      : `还需 ${2 - memberCount} 人`}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLeave}
                    className="h-10 text-[13px] text-neutral-400 hover:text-neutral-900"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    解散
                  </Button>
                </>
              ) : isMember ? (
                <Button
                  variant="ghost"
                  onClick={handleLeave}
                  className="h-10 text-[13px] text-neutral-400 hover:text-neutral-900"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  离开
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  className="h-10 flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px]"
                >
                  加入房间
                </Button>
              )}
            </div>
          </div>

          {/* Topic Preview */}
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
                  <p className="text-[14px] font-medium text-neutral-900">
                    {paper.topic}
                  </p>
                </div>
                <Separator className="bg-neutral-100" />
                <div>
                  <p className="text-[12px] text-neutral-400 mb-1">
                    {paper.part_a_title}
                  </p>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    Source: {paper.part_a_source}
                  </p>
                  <ol className="text-[13px] text-neutral-600 space-y-2 list-decimal list-inside">
                    {paper.part_a_discussion_points?.map(
                      (point: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          {point}
                        </li>
                      )
                    )}
                  </ol>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">未选择题目</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
