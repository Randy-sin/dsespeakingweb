"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

interface PostActionBarProps {
  postId: string;
  initialLikeCount: number;
  initialBookmarkCount: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
}

export function PostActionBar({
  postId,
  initialLikeCount,
  initialBookmarkCount,
  initialLiked,
  initialBookmarked,
}: PostActionBarProps) {
  const router = useRouter();
  const { user } = useUser();
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);
  const [pending, setPending] = useState<"like" | "bookmark" | null>(null);

  const ensureAuth = () => {
    if (user) return true;
    toast.error("登入後才可以收藏或按讚");
    router.push("/login");
    return false;
  };

  const toggleAction = async (kind: "like" | "bookmark") => {
    if (!ensureAuth()) return;

    const active = kind === "like" ? liked : bookmarked;
    const setter = kind === "like" ? setLiked : setBookmarked;
    const countSetter = kind === "like" ? setLikeCount : setBookmarkCount;

    setter(!active);
    countSetter((current) => Math.max(0, current + (active ? -1 : 1)));
    setPending(kind);

    try {
      const res = await fetch(
        kind === "like"
          ? `/api/forum/posts/${postId}/like`
          : `/api/forum/posts/${postId}/bookmark`,
        {
          method: active ? "DELETE" : "POST",
        }
      );

      if (!res.ok) {
        throw new Error("request failed");
      }
    } catch {
      setter(active);
      countSetter((current) => Math.max(0, current + (active ? 1 : -1)));
      toast.error(kind === "like" ? "按讚失敗，請稍後再試" : "收藏失敗，請稍後再試");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        aria-label={`${liked ? "取消讚好" : "讚好"}，目前 ${likeCount} 個讚好`}
        aria-pressed={liked}
        onClick={() => toggleAction("like")}
        disabled={pending === "like"}
        className={cn(
          "rounded-full border-neutral-200 bg-white px-4 text-[13px] text-neutral-500 hover:text-neutral-900",
          liked && "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        {likeCount}
      </Button>
      <Button
        variant="outline"
        aria-label={`${bookmarked ? "取消收藏" : "收藏"}，目前 ${bookmarkCount} 個收藏`}
        aria-pressed={bookmarked}
        onClick={() => toggleAction("bookmark")}
        disabled={pending === "bookmark"}
        className={cn(
          "rounded-full border-neutral-200 bg-white px-4 text-[13px] text-neutral-500 hover:text-neutral-900",
          bookmarked &&
            "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarkCount}
      </Button>
    </div>
  );
}
