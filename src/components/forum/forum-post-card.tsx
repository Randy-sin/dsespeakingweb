"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, ArrowUpRight, Clock3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  buildForumPostHref,
  buildPaperHref,
  formatPaperShortLabel,
  getPostTypeLabel,
  getPostTypeTone,
} from "@/lib/forum/constants";
import type { ForumPostWithContext } from "@/lib/forum/server";

interface ForumPostCardProps {
  post: ForumPostWithContext;
  compact?: boolean;
}

export function ForumPostCard({ post, compact = false }: ForumPostCardProps) {
  return (
    <article
      className={cn(
        "group rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_60px_-36px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300",
        compact ? "p-5" : "p-6"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
        <Badge
          variant="outline"
          className={cn("rounded-full border px-2.5 py-1", getPostTypeTone(post.post_type))}
        >
          {getPostTypeLabel(post.post_type)}
        </Badge>
        {post.focus_label && (
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-500">
            {post.focus_label}
          </span>
        )}
        {post.is_featured && (
          <span className="rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-white">
            精華
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href={buildForumPostHref(post)} className="block">
            <h3 className="font-serif text-[22px] leading-tight text-neutral-950 transition-colors group-hover:text-neutral-700">
              {post.title}
            </h3>
          </Link>
          <p className="mt-3 text-[14px] leading-7 text-neutral-600">
            {post.excerpt_text}
          </p>
        </div>

        <Link href={buildForumPostHref(post)} className="hidden sm:block">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <Link
              key={tag.id}
              href={`/forum?tag=${tag.slug}`}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-neutral-100">
            <AvatarFallback className="bg-neutral-900 text-[11px] text-white">
              {post.author?.display_name?.slice(0, 2)?.toUpperCase() || "DS"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-neutral-900">
              {post.author?.display_name || "DSE Candidate"}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-neutral-400">
              <Clock3 className="h-3.5 w-3.5" />
              <span>
                {formatDistanceToNow(new Date(post.last_activity_at), {
                  addSuffix: true,
                  locale: zhTW,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[12px] text-neutral-400">
          <Link
            href={buildPaperHref(post.paper)}
            className="max-w-full truncate rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
          >
            {formatPaperShortLabel(post.paper)}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comment_count}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            {post.bookmark_count}
          </span>
        </div>
      </div>
    </article>
  );
}
