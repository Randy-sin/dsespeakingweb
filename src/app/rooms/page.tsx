"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { RoomCard } from "@/components/room/room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw, Loader2, Mic, Users, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import type { Room, Profile, RoomMember } from "@/lib/supabase/types";

type RoomWithInfo = Room & {
  host: Profile;
  room_members: (RoomMember & { profiles: Profile })[];
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithInfo[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetchedOnce = useRef(false);

  const fetchRooms = useCallback(
    async (opts?: { showSpinner?: boolean }) => {
      if (opts?.showSpinner) setRefreshing(true);

      const { data, error } = await supabase
        .from("rooms")
        .select(
          `*, host:profiles!rooms_host_id_fkey(*), room_members(*, profiles(*))`
        )
        .in("status", ["waiting", "preparing", "discussing", "individual"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setRooms(data as unknown as RoomWithInfo[]);
      }

      if (!hasFetchedOnce.current) {
        hasFetchedOnce.current = true;
        setInitialLoading(false);
      }
      if (opts?.showSpinner) {
        setTimeout(() => setRefreshing(false), 400);
      }
    },
    [supabase]
  );

  const debouncedRealtimeFetch = useCallback(() => {
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      fetchRooms();
    }, 800);
  }, [fetchRooms]);

  const handleRefresh = async () => {
    await fetchRooms({ showSpinner: true });
  };

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel("rooms-lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        debouncedRealtimeFetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members" },
        debouncedRealtimeFetch
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    };
  }, [fetchRooms, debouncedRealtimeFetch, supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 180);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        if (!debouncedSearch) return true;
        return (
          room.name.toLowerCase().includes(debouncedSearch) ||
          room.host?.display_name?.toLowerCase().includes(debouncedSearch)
        );
      }),
    [rooms, debouncedSearch]
  );

  const waitingCount = rooms.filter((r) => r.status === "waiting").length;
  const activeCount = rooms.filter((r) => r.status !== "waiting").length;

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      {/* Header area with subtle background */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-serif text-[28px] sm:text-[36px] font-semibold text-neutral-900 tracking-tight">
                  Rooms
                </h1>
                {rooms.length > 0 && (
                  <span className="inline-flex min-h-7 items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {rooms.length} live
                  </span>
                )}
              </div>
              <p className="text-[13px] sm:text-[14px] text-neutral-400">
                加入一個練習房間，或建立你自己的。即時配對，隨時開始。
              </p>
            </div>
            <Link href="/rooms/create" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] min-h-11 rounded-full px-6 shadow-sm shadow-neutral-900/10 transition-all hover:shadow-md hover:shadow-neutral-900/15 hover:-translate-y-0.5">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                建立房間
              </Button>
            </Link>
          </div>

          {/* Stats + Search row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 w-full sm:w-auto">
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 text-[12px] text-neutral-500">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <span>{waitingCount} 等待中</span>
              </div>
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 text-[12px] text-neutral-500">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                  <Mic className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <span>{activeCount} 進行中</span>
              </div>
              {rooms.some((r) => r.status === "discussing" || r.status === "individual") && (
                <div className="col-span-2 sm:col-span-1 flex min-h-11 items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 text-[12px] text-neutral-500">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                    <Eye className="h-3.5 w-3.5 text-neutral-500" />
                  </div>
                  <span>可觀看</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
                <Input
                  placeholder="搜尋房間或主持人..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 min-h-11 text-[14px] border-neutral-200 rounded-xl bg-neutral-50 focus-visible:ring-neutral-300 focus-visible:bg-white"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="min-h-11 min-w-11 border-neutral-200 text-neutral-400 hover:text-neutral-900 rounded-xl shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {initialLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-100 bg-white p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-neutral-100" />
                    <div className="h-2.5 w-1/3 rounded bg-neutral-50" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-neutral-50" />
                <div className="h-3 w-4/5 rounded bg-neutral-50" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 rounded-full bg-neutral-100" />
                  <div className="h-6 w-12 rounded-full bg-neutral-50" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          /* ── Rich Empty State ── */
          <div className="flex flex-col items-center justify-center py-20 sm:py-28">
            <div className="relative mb-8">
              {/* Decorative circles */}
              <div className="absolute -inset-8 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-full blur-2xl opacity-60" />
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                <Users className="h-8 w-8 text-neutral-300" />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-2 -right-3 w-6 h-6 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center animate-float">
                <Mic className="h-3 w-3 text-neutral-400" />
              </div>
              <div className="absolute -bottom-1 -left-3 w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center animate-float delay-300">
                <span className="text-[8px] text-white font-bold">4</span>
              </div>
            </div>

            <h3 className="font-serif text-[22px] font-semibold text-neutral-900 tracking-tight mb-2">
              {search ? "沒有匹配的房間" : "暫時沒有開放的房間"}
            </h3>
            <p className="text-[14px] text-neutral-400 mb-8 max-w-xs text-center leading-relaxed">
              {search
                ? "試試其他關鍵詞，或建立一個新房間"
                : "成為第一個建立練習房間的人，邀請夥伴一起練習 DSE Speaking"}
            </p>

            {!search && (
              <Link href="/rooms/create">
                <Button className="h-11 px-7 text-[14px] bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 transition-all hover:shadow-xl hover:shadow-neutral-900/25 hover:-translate-y-0.5">
                  建立練習房間
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}

            {/* Tips section */}
            <div className="mt-16 w-full max-w-lg">
              <p className="text-[11px] text-neutral-300 tracking-[0.15em] uppercase text-center mb-4">
                Quick tips
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "建立房間", desc: "選擇真題，設定房間" },
                  { title: "等待隊友", desc: "分享連結，等人加入" },
                  { title: "開始練習", desc: "4 人到齊，一鍵開始" },
                ].map((tip, i) => (
                  <div key={tip.title} className="bg-white rounded-xl border border-neutral-100 p-4 text-center">
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center mx-auto mb-2.5">
                      {i + 1}
                    </div>
                    <p className="text-[13px] font-medium text-neutral-900 mb-0.5">{tip.title}</p>
                    <p className="text-[12px] text-neutral-400">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room, i) => (
                <div
                  key={room.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
            {filteredRooms.length >= 6 && (
              <p className="text-[12px] text-neutral-300 text-center mt-8">
                顯示全部 {filteredRooms.length} 個房間
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
