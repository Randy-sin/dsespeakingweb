"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight, Users, CalendarDays, Eye } from "lucide-react";
import type { Room, Profile, RoomMember } from "@/lib/supabase/types";

type RoomWithInfo = Room & {
  host: Profile;
  room_members: (RoomMember & { profiles: Profile })[];
};

interface RoomCardProps {
  room: RoomWithInfo;
}

export function RoomCard({ room }: RoomCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const participants = room.room_members?.filter((m) => m.role !== "spectator") || [];
  const spectators = room.room_members?.filter((m) => m.role === "spectator") || [];
  const participantCount = participants.length;
  const spectatorCount = spectators.length;
  const isFull = participantCount >= room.max_members;
  const isHost = user?.id === room.host_id;
  const isMember = room.room_members?.some((m) => m.user_id === user?.id);

  // Room is in an active session (not waiting / not finished)
  const isInSession =
    room.status === "preparing" ||
    room.status === "discussing" ||
    room.status === "individual";

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isMember || isHost) {
      router.push(
        isInSession ? `/rooms/${room.id}/session` : `/rooms/${room.id}`
      );
      return;
    }
    if (room.status === "waiting") {
      // Join as participant
      if (isFull) {
        toast.error("房间已满");
        return;
      }
      const { error } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        role: "participant",
      });
      if (error) {
        toast.error("加入房间失败");
        return;
      }
      router.push(`/rooms/${room.id}`);
    } else if (isInSession) {
      // Join as spectator
      const { error } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        role: "spectator",
      });
      if (error) {
        toast.error("加入观看失败");
        return;
      }
      router.push(`/rooms/${room.id}/session`);
    }
  };

  const statusConfig: Record<
    string,
    { label: string; color: string; dot: string }
  > = {
    waiting: {
      label: "等待中",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      dot: "bg-emerald-500",
    },
    preparing: {
      label: "准备中",
      color: "text-amber-600 bg-amber-50 border-amber-100",
      dot: "bg-amber-500",
    },
    discussing: {
      label: "讨论中",
      color: "text-blue-600 bg-blue-50 border-blue-100",
      dot: "bg-blue-500",
    },
    individual: {
      label: "回应中",
      color: "text-violet-600 bg-violet-50 border-violet-100",
      dot: "bg-violet-500",
    },
    finished: {
      label: "已结束",
      color: "text-neutral-500 bg-neutral-100 border-neutral-200",
      dot: "bg-neutral-400",
    },
  };

  const status = statusConfig[room.status] || statusConfig.waiting;

  return (
    <div
      className="group relative bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 hover:shadow-lg hover:shadow-neutral-100/80 transition-all duration-300 cursor-pointer"
      onClick={handleJoin}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${status.color}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${status.dot} ${
              room.status === "waiting" ? "animate-pulse" : ""
            }`}
          />
          {status.label}
        </span>
        <span className="text-[11px] text-neutral-300">
          {formatDistanceToNow(new Date(room.created_at), {
            addSuffix: true,
            locale: zhCN,
          })}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-serif text-[18px] font-semibold text-neutral-900 tracking-tight mb-2 group-hover:text-neutral-700 transition-colors truncate">
        {room.name}
      </h3>

      {/* Scheduled time */}
      {room.scheduled_at && (
        <div className="flex items-center gap-1.5 mb-3">
          <CalendarDays className="h-3 w-3 text-neutral-400" />
          <span className="text-[12px] text-neutral-500">
            {(() => {
              const d = new Date(room.scheduled_at);
              const prefix = isToday(d)
                ? "今天"
                : isTomorrow(d)
                  ? "明天"
                  : format(d, "M/d", { locale: zhCN });
              return `${prefix} ${format(d, "HH:mm")}`;
            })()}
          </span>
        </div>
      )}

      {/* Host */}
      <div className="flex items-center gap-2 mb-5">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-neutral-900 text-white font-medium">
            {room.host?.display_name?.slice(0, 1)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[13px] text-neutral-500">
          {room.host?.display_name || "Unknown"}
        </span>
        {isHost && (
          <span className="text-[10px] text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5">
            你
          </span>
        )}
      </div>

      {/* Members bar */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
        <div className="flex items-center gap-3">
          {/* Stacked avatars */}
          <div className="flex items-center -space-x-2">
            {participants.slice(0, 4).map((member, i) => (
              <Avatar
                key={member.id}
                className="h-7 w-7 border-2 border-white"
                style={{ zIndex: 4 - i }}
              >
                <AvatarFallback className="text-[9px] bg-neutral-200 text-neutral-600 font-medium">
                  {member.profiles?.display_name
                    ?.slice(0, 1)
                    ?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {participantCount < room.max_members && room.status === "waiting" && (
              <div
                className="h-7 w-7 rounded-full border-2 border-white bg-neutral-50 flex items-center justify-center border-dashed border-neutral-200"
                style={{ zIndex: 0 }}
              >
                <Users className="h-3 w-3 text-neutral-300" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-neutral-400 tabular-nums">
              {participantCount}/{room.max_members}
            </span>
            {spectatorCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-neutral-300">
                <Eye className="h-3 w-3" />
                {spectatorCount}
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          className={`text-[12px] h-8 rounded-full px-4 transition-all ${
            isMember || isHost
              ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 shadow-none"
              : isInSession
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : isFull
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                  : "bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm"
          }`}
          disabled={!isInSession && isFull && !isMember && !isHost}
          onClick={(e) => {
            e.stopPropagation();
            handleJoin();
          }}
        >
          {isMember || isHost ? (
            <>
              进入
              <ArrowRight className="ml-1 h-3 w-3" />
            </>
          ) : isInSession ? (
            <>
              <Eye className="mr-1 h-3 w-3" />
              观看
            </>
          ) : isFull ? (
            "已满"
          ) : (
            "加入"
          )}
        </Button>
      </div>
    </div>
  );
}
