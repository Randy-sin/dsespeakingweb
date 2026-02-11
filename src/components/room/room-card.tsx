"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
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
  const memberCount = room.room_members?.length || 0;
  const isFull = memberCount >= room.max_members;
  const isHost = user?.id === room.host_id;
  const isMember = room.room_members?.some((m) => m.user_id === user?.id);

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isMember || isHost) {
      router.push(`/rooms/${room.id}`);
      return;
    }
    if (isFull) {
      toast.error("房间已满");
      return;
    }
    const { error } = await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: user.id,
    });
    if (error) {
      toast.error("加入房间失败");
      return;
    }
    router.push(`/rooms/${room.id}`);
  };

  const statusLabel: Record<string, string> = {
    waiting: "等待中",
    preparing: "准备中",
    discussing: "讨论中",
    individual: "回应中",
    finished: "已结束",
  };

  return (
    <div
      className="group border border-neutral-200/60 rounded-lg p-5 hover:border-neutral-300 transition-colors cursor-pointer"
      onClick={handleJoin}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-neutral-900 truncate">
            {room.name}
          </h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">
            {formatDistanceToNow(new Date(room.created_at), {
              addSuffix: true,
              locale: zhCN,
            })}
          </p>
        </div>
        <span className="text-[11px] text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 shrink-0 ml-3">
          {statusLabel[room.status] || "等待中"}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-[9px] bg-neutral-100 text-neutral-500">
            {room.host?.display_name?.slice(0, 1)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[13px] text-neutral-500">
          {room.host?.display_name || "Unknown"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: room.max_members }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < memberCount ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            />
          ))}
          <span className="text-[12px] text-neutral-400 ml-1.5">
            {memberCount}/{room.max_members}
          </span>
        </div>
        <Button
          size="sm"
          variant={isMember || isHost ? "ghost" : "default"}
          className={`text-[12px] h-7 ${
            isMember || isHost
              ? "text-neutral-500"
              : "bg-neutral-900 hover:bg-neutral-800 text-white"
          }`}
          disabled={isFull && !isMember && !isHost}
          onClick={(e) => {
            e.stopPropagation();
            handleJoin();
          }}
        >
          {isMember || isHost
            ? "进入"
            : isFull
              ? "已满"
              : "加入"}
        </Button>
      </div>
    </div>
  );
}
