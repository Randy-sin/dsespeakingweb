"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORUM_POST_TYPE_OPTIONS } from "@/lib/forum/constants";
import type { ForumTagOption } from "@/lib/forum/server";
import type { PastPaper, ForumPostType } from "@/lib/supabase/types";

interface NewPostFormProps {
  papers: Pick<PastPaper, "id" | "paper_id" | "paper_number" | "topic" | "year">[];
  tags: ForumTagOption[];
  initialPaperId?: string;
  initialPostType?: ForumPostType;
}

export function NewPostForm({
  papers,
  tags,
  initialPaperId,
  initialPostType = "paper_discussion",
}: NewPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [paperId, setPaperId] = useState(initialPaperId ?? "none");
  const [postType, setPostType] = useState<ForumPostType>(initialPostType);
  const [focusLabel, setFocusLabel] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sortedPapers = useMemo(
    () =>
      [...papers].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return a.paper_number.localeCompare(b.paper_number);
      }),
    [papers]
  );

  const toggleTag = (slug: string) => {
    setSelectedTags((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length < 6) {
      toast.error("標題至少要 6 個字");
      return;
    }

    if (content.trim().length < 40) {
      toast.error("內容太短了，至少要 40 個字");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          paperId: paperId === "none" ? null : paperId,
          postType,
          focusLabel: focusLabel.trim() || null,
          tagSlugs: selectedTags,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "request failed");
      }

      toast.success("討論已發佈");
      router.push(`/forum/${data.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "發佈失敗，請稍後再試"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回論壇
        </Link>

        <div className="mt-8 rounded-[32px] border border-neutral-200/80 bg-white p-7 shadow-[0_30px_120px_-52px_rgba(15,23,42,0.24)] sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-neutral-400">
                Start a discussion
              </p>
              <h1 className="mt-3 font-serif text-[34px] leading-none text-neutral-950">
                發佈一篇值得被討論的帖
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
                聚焦一個真題、一個 Part B 問題，或一次模擬練習後最值得講的發現。內容越具體，越容易吸引別人回覆。
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-[#f8f7f3] px-4 py-3 text-[12px] text-neutral-500">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-neutral-700" />
                不做 AI 感話術，直接講真實思路與例子。
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px] text-neutral-600">標題</Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：2024 4.1 Part B 第 2 題如何講得自然又不空泛？"
                  className="h-12 rounded-xl border-neutral-200 bg-neutral-50 text-[14px] focus-visible:bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-neutral-600">貼文類型</Label>
                <Select
                  value={postType}
                  onValueChange={(value) => setPostType(value as ForumPostType)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORUM_POST_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <div className="space-y-2">
                <Label className="text-[13px] text-neutral-600">關聯真題</Label>
                <Select value={paperId} onValueChange={setPaperId}>
                  <SelectTrigger className="h-12 rounded-xl border-neutral-200 bg-neutral-50 text-[14px]">
                    <SelectValue placeholder="選擇一份 speaking paper" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="none">不綁定真題</SelectItem>
                    {sortedPapers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id}>
                        {paper.year} · {paper.paper_number} · {paper.topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-neutral-600">聚焦點位</Label>
                <Input
                  value={focusLabel}
                  onChange={(event) => setFocusLabel(event.target.value)}
                  placeholder="例如：Part B 第 3 題 / 練習後復盤"
                  className="h-12 rounded-xl border-neutral-200 bg-neutral-50 text-[14px] focus-visible:bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[13px] text-neutral-600">內容</Label>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="寫出你的立場、例子、你會怎樣開場、怎樣接別人的話，或你在模擬中遇到的真問題。"
                className="min-h-[280px] rounded-[24px] border-neutral-200 bg-neutral-50 px-5 py-4 text-[15px] leading-7 focus-visible:bg-white"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[13px] text-neutral-600">標籤</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.slug);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.slug)}
                      className={`rounded-full border px-3 py-2 text-[13px] transition-colors ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-[#f8f7f3] p-5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-800">
                <FileText className="h-4 w-4" />
                建議內容框架
              </div>
              <div className="mt-3 space-y-2 text-[13px] leading-6 text-neutral-600">
                <p>1. 先寫你覺得這題最難的地方是什麼。</p>
                <p>2. 再寫你會怎樣組織觀點或例子。</p>
                <p>3. 最後補一句你希望別人回覆你什麼。</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-neutral-400">
                你的帖子會公開顯示在論壇與對應真題頁中。
              </p>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-full bg-neutral-900 px-6 text-[14px] text-white hover:bg-neutral-800"
              >
                發佈討論
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
