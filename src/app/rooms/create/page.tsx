"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Shuffle, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import type { PastPaper } from "@/lib/supabase/types";

function getDateOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    const label =
      i === 0
        ? `今天 (${d.getMonth() + 1}/${d.getDate()} 周${weekday})`
        : i === 1
          ? `明天 (${d.getMonth() + 1}/${d.getDate()} 周${weekday})`
          : `${d.getMonth() + 1}月${d.getDate()}日 周${weekday}`;
    options.push({ value, label });
  }
  return options;
}

function getTimeOptions(selectedDate: string) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = selectedDate === todayStr;

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (isToday) {
        const slotTime = new Date(now);
        slotTime.setHours(h, m, 0, 0);
        // Only show times at least 30 min from now
        if (slotTime.getTime() < now.getTime() + 30 * 60 * 1000) continue;
      }
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayH}:${String(m).padStart(2, "0")} ${period}`;
      options.push({ value, label });
    }
  }
  return options;
}

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [paperId, setPaperId] = useState<string>("random");
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);

  // Schedule state
  const dateOptions = useMemo(() => getDateOptions(), []);
  const [scheduledDate, setScheduledDate] = useState(dateOptions[0].value);
  const [scheduledTime, setScheduledTime] = useState("");
  const timeOptions = useMemo(
    () => getTimeOptions(scheduledDate),
    [scheduledDate]
  );

  // Auto-select first available time when date changes
  useEffect(() => {
    if (timeOptions.length > 0 && !timeOptions.find((t) => t.value === scheduledTime)) {
      setScheduledTime(timeOptions[0].value);
    }
  }, [timeOptions, scheduledTime]);

  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchPapers = async () => {
      const { data } = await supabase
        .from("pastpaper_papers")
        .select("*")
        .order("year", { ascending: false })
        .order("paper_number", { ascending: true });
      if (data) setPapers(data);
      setLoadingPapers(false);
    };
    fetchPapers();
  }, [supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!scheduledTime) {
      toast.error("请选择开始时间");
      return;
    }
    setLoading(true);
    try {
      let selectedPaperId: string | null = null;
      if (paperId === "random") {
        const randomIndex = Math.floor(Math.random() * papers.length);
        selectedPaperId = papers[randomIndex]?.id || null;
      } else {
        selectedPaperId = paperId;
      }

      // Build scheduled_at timestamp
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          name: name || `${user.email?.split("@")[0] || "User"}的练习房`,
          host_id: user.id,
          paper_id: selectedPaperId,
          scheduled_at: scheduledAt,
        })
        .select()
        .single();
      if (roomError) throw roomError;
      const { error: memberError } = await supabase
        .from("room_members")
        .insert({ room_id: room.id, user_id: user.id, speaking_order: 1 });
      if (memberError) throw memberError;
      toast.success("房间已创建");
      router.push(`/rooms/${room.id}`);
    } catch (error) {
      console.error(error);
      toast.error("创建失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const papersByYear = papers.reduce(
    (acc, paper) => {
      const year = paper.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(paper);
      return acc;
    },
    {} as Record<number, PastPaper[]>
  );

  // Preview scheduled datetime
  const scheduledPreview = useMemo(() => {
    if (!scheduledDate || !scheduledTime) return null;
    const d = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    const h = d.getHours();
    const period = h < 12 ? "AM" : "PM";
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d.getMonth() + 1}月${d.getDate()}日 周${weekday} ${displayH}:${String(d.getMinutes()).padStart(2, "0")} ${period}`;
  }, [scheduledDate, scheduledTime]);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-10">
        <Link
          href="/rooms"
          className="inline-flex items-center text-[13px] text-neutral-400 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          返回
        </Link>

        <h1 className="font-serif text-[32px] font-semibold text-neutral-900 tracking-tight mb-2">
          创建房间
        </h1>
        <p className="text-[14px] text-neutral-400 mb-10">
          设置房间信息，选择练习时间，等待队友加入
        </p>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Room name */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[13px] text-neutral-500">房间名称</Label>
              <Input
                placeholder="给你的房间起个名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-[14px] border-neutral-200 focus-visible:ring-neutral-400 rounded-lg"
              />
            </div>

            {/* Paper select */}
            <div className="space-y-1.5">
              <Label className="text-[13px] text-neutral-500">题目</Label>
              {loadingPapers ? (
                <div className="flex items-center gap-2 text-[13px] text-neutral-400 h-10">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  加载中...
                </div>
              ) : (
                <Select value={paperId} onValueChange={setPaperId}>
                  <SelectTrigger className="w-full h-10 text-[14px] border-neutral-200 rounded-lg">
                    <SelectValue placeholder="选择一个题目" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-80 w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="random">
                      <div className="flex items-center gap-2">
                        <Shuffle className="h-3.5 w-3.5" />
                        随机题目
                      </div>
                    </SelectItem>
                    {Object.entries(papersByYear)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([year, yearPapers]) => (
                        <div key={year}>
                          <div className="px-2 py-1.5 text-[11px] text-neutral-400 bg-neutral-50 sticky top-0">
                            {year}
                          </div>
                          {yearPapers.map((paper) => (
                            <SelectItem key={paper.id} value={paper.id}>
                              <span className="text-[13px] truncate">
                                {paper.paper_number} — {paper.topic}
                              </span>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Schedule section */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-4 w-4 text-neutral-400" />
              <Label className="text-[14px] font-medium text-neutral-900">计划开始时间</Label>
            </div>
            <p className="text-[12px] text-neutral-400 -mt-2">
              选择你计划开始口语练习的日期和时间，方便队友按时加入
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Date select */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-neutral-400">日期</Label>
                <Select value={scheduledDate} onValueChange={setScheduledDate}>
                  <SelectTrigger className="w-full h-10 text-[13px] border-neutral-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72 w-[var(--radix-select-trigger-width)]">
                    {dateOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time select */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-neutral-400">时间</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="w-full h-10 text-[13px] border-neutral-200 rounded-lg">
                    <SelectValue placeholder="选择时间" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72 w-[var(--radix-select-trigger-width)]">
                    {timeOptions.length > 0 ? (
                      timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-3 text-[12px] text-neutral-400 text-center">
                        今天已无可选时段，请选择其他日期
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            {scheduledPreview && (
              <div className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3.5 py-2.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span className="text-[13px] text-neutral-600">
                  计划于 <span className="font-medium text-neutral-900">{scheduledPreview}</span> 开始
                </span>
              </div>
            )}
          </div>

          {/* Flow info */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <p className="text-[13px] font-medium text-neutral-900 mb-3">
              练习流程
            </p>
            <div className="space-y-2 text-[13px] text-neutral-500">
              <p>1. 等待 2-4 人加入后由房主启动</p>
              <p>2. 准备阶段 — 10 分钟阅读文章和问题</p>
              <p>3. 小组讨论 — 8 分钟自由讨论</p>
              <p>4. 个人回应 — 每人 1 分钟回答跟进问题</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-xl shadow-sm"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建房间
          </Button>
        </form>
      </div>
    </div>
  );
}
