"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { RoomCard } from "@/components/room/room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Room, Profile, RoomMember } from "@/lib/supabase/types";

type RoomWithInfo = Room & {
  host: Profile;
  room_members: (RoomMember & { profiles: Profile })[];
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select(
        `*, host:profiles!rooms_host_id_fkey(*), room_members(*, profiles(*))`
      )
      .in("status", ["waiting", "preparing"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRooms(data as unknown as RoomWithInfo[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel("rooms-lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchRooms()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members" },
        () => fetchRooms()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms, supabase]);

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.host?.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-serif text-[28px] font-semibold text-neutral-900 tracking-tight">
              Rooms
            </h1>
            <p className="text-[14px] text-neutral-400 mt-1">
              加入一个房间，或创建你自己的练习房间
            </p>
          </div>
          <Link href="/rooms/create">
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] h-9 rounded-full px-5">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              创建房间
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
            <Input
              placeholder="搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRooms}
            className="h-9 w-9 text-neutral-400 hover:text-neutral-900"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[15px] text-neutral-900 mb-1">
              {search ? "没有找到匹配的房间" : "暂时没有可用房间"}
            </p>
            <p className="text-[13px] text-neutral-400 mb-6">
              {search ? "试试其他关键词" : "成为第一个创建房间的人"}
            </p>
            {!search && (
              <Link href="/rooms/create">
                <Button className="bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] h-9 rounded-full px-5">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  创建房间
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
