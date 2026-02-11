"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Loader2, Shuffle } from "lucide-react";
import Link from "next/link";
import type { PastPaper } from "@/lib/supabase/types";

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [paperId, setPaperId] = useState<string>("random");
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);
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
    setLoading(true);
    try {
      let selectedPaperId: string | null = null;
      if (paperId === "random") {
        const randomIndex = Math.floor(Math.random() * papers.length);
        selectedPaperId = papers[randomIndex]?.id || null;
      } else {
        selectedPaperId = paperId;
      }
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          name: name || `${user.email?.split("@")[0] || "User"}的练习房`,
          host_id: user.id,
          paper_id: selectedPaperId,
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-10">
        <Link
          href="/rooms"
          className="inline-flex items-center text-[13px] text-neutral-400 hover:text-neutral-900 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          返回
        </Link>

        <h1 className="font-serif text-[28px] font-semibold text-neutral-900 tracking-tight mb-2">
          创建房间
        </h1>
        <p className="text-[14px] text-neutral-400 mb-10">
          设置房间信息，等待队友加入后开始练习
        </p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-neutral-500">房间名称</Label>
            <Input
              placeholder="给你的房间起个名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] text-neutral-500">题目</Label>
            {loadingPapers ? (
              <div className="flex items-center gap-2 text-[13px] text-neutral-400 h-10">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中...
              </div>
            ) : (
              <Select value={paperId} onValueChange={setPaperId}>
                <SelectTrigger className="h-10 text-[14px] border-neutral-200">
                  <SelectValue placeholder="选择一个题目" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
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

          <div className="border border-neutral-150 rounded-lg p-5 bg-neutral-50/50">
            <p className="text-[13px] font-medium text-neutral-900 mb-3">
              练习流程
            </p>
            <div className="space-y-2 text-[13px] text-neutral-500">
              <p>1. 等待 3-4 人加入后由房主启动</p>
              <p>2. 准备阶段 — 10 分钟阅读文章和问题</p>
              <p>3. 小组讨论 — 8 分钟 (4人) / 6 分钟 (3人)</p>
              <p>4. 个人回应 — 每人 1 分钟回答跟进问题</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px]"
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
