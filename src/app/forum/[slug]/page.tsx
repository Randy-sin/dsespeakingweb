import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForumPostCard } from "@/components/forum/forum-post-card";
import { PostActionBar } from "@/components/forum/post-action-bar";
import { CommentForm } from "@/components/forum/comment-form";
import { fetchForumPostDetail } from "@/lib/forum/server";
import {
  buildPaperHref,
  formatPaperShortLabel,
  getPostTypeLabel,
  getPostTypeTone,
} from "@/lib/forum/constants";

type Params = Promise<{ slug: string }>;

export default async function ForumPostDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { post, comments, relatedPosts, userState, forumReady } =
    await fetchForumPostDetail(slug);

  if (!post) {
    notFound();
  }

  const topLevelComments = comments.filter((comment) => !comment.parent_id);
  const childMap = new Map<string, typeof comments>();
  comments
    .filter((comment) => comment.parent_id)
    .forEach((comment) => {
      const siblings = childMap.get(comment.parent_id!) ?? [];
      siblings.push(comment);
      childMap.set(comment.parent_id!, siblings);
    });

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回論壇
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.45fr]">
          <article className="rounded-[32px] border border-neutral-200/80 bg-white p-7 shadow-[0_30px_120px_-52px_rgba(15,23,42,0.24)] sm:p-10">
            {!forumReady && (
              <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 text-[14px] leading-7 text-amber-900">
                這個詳情頁已經就緒；如果目前 Supabase 還沒有論壇 schema，留言與互動送出會暫時不可用。
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`rounded-full border px-2.5 py-1 ${getPostTypeTone(post.post_type)}`}
              >
                {getPostTypeLabel(post.post_type)}
              </Badge>
              {post.focus_label && (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] text-neutral-500">
                  {post.focus_label}
                </span>
              )}
            </div>

            <h1 className="mt-5 font-serif text-[34px] leading-tight text-neutral-950 sm:text-[46px]">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-neutral-100">
                  <AvatarFallback className="bg-neutral-900 text-[11px] text-white">
                    {post.author?.display_name?.slice(0, 2)?.toUpperCase() || "DS"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[14px] font-medium text-neutral-900">
                    {post.author?.display_name || "DSE Candidate"}
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                  </p>
                </div>
              </div>

              <Link
                href={buildPaperHref(post.paper)}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
              >
                {formatPaperShortLabel(post.paper)}
              </Link>
            </div>

            <div className="mt-7 space-y-5 text-[15px] leading-8 text-neutral-700">
              {post.content.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${post.id}-paragraph-${index}`}>{paragraph.trim()}</p>
              ))}
            </div>

            {post.tags.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/forum?tag=${tag.slug}`}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-neutral-100 pt-6">
              <PostActionBar
                postId={post.id}
                initialLikeCount={post.like_count}
                initialBookmarkCount={post.bookmark_count}
                initialLiked={userState.liked}
                initialBookmarked={userState.bookmarked}
              />
            </div>

            <section className="mt-10 border-t border-neutral-100 pt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[28px] text-neutral-950">
                  回覆 ({comments.length})
                </h2>
              </div>

              <div className="mt-6 rounded-[28px] border border-neutral-200 bg-[#faf9f5] p-5">
                <CommentForm postId={post.id} />
              </div>

              <div className="mt-6 space-y-4">
                {topLevelComments.length === 0 ? (
                  <div className="rounded-[24px] border border-neutral-200 bg-white p-8 text-center">
                    <MessageSquareText className="mx-auto h-8 w-8 text-neutral-300" />
                    <h3 className="mt-4 font-serif text-[24px] text-neutral-950">
                      還沒有回覆
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-neutral-500">
                      如果你對這題有自己的想法、例子或實戰經驗，現在就是最好的補充時機。
                    </p>
                  </div>
                ) : (
                  topLevelComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-[24px] border border-neutral-200 bg-white p-5"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border border-neutral-100">
                          <AvatarFallback className="bg-neutral-100 text-[11px] text-neutral-700">
                            {comment.author?.display_name?.slice(0, 2)?.toUpperCase() ||
                              "DS"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-medium text-neutral-900">
                              {comment.author?.display_name || "DSE Candidate"}
                            </p>
                            <span className="text-[12px] text-neutral-400">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: zhTW,
                              })}
                            </span>
                          </div>
                          <p className="mt-3 text-[14px] leading-7 text-neutral-700">
                            {comment.content}
                          </p>
                        </div>
                      </div>

                      {(childMap.get(comment.id) ?? []).length > 0 && (
                        <div className="mt-4 space-y-3 border-l border-neutral-100 pl-5">
                          {(childMap.get(comment.id) ?? []).map((reply) => (
                            <div key={reply.id} className="rounded-2xl bg-neutral-50 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-medium text-neutral-900">
                                  {reply.author?.display_name || "DSE Candidate"}
                                </span>
                                <span className="text-[12px] text-neutral-400">
                                  {formatDistanceToNow(new Date(reply.created_at), {
                                    addSuffix: true,
                                    locale: zhTW,
                                  })}
                                </span>
                              </div>
                              <p className="mt-2 text-[14px] leading-7 text-neutral-700">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                Related paper
              </p>
              <div className="mt-5 rounded-[24px] border border-neutral-200 bg-[#faf9f5] p-5">
                <p className="text-[12px] text-neutral-400">
                  {post.paper?.year} · {post.paper?.paper_number}
                </p>
                <h2 className="mt-2 font-serif text-[24px] text-neutral-950">
                  {post.paper?.topic || "General discussion"}
                </h2>
                <p className="mt-3 text-[14px] leading-7 text-neutral-600">
                  {post.paper?.part_a_title ||
                    "這篇帖子沒有綁定特定真題，但仍然適合放在論壇首頁瀏覽。"}
                </p>
                {post.paper && (
                  <Button asChild variant="outline" className="mt-5 rounded-full border-neutral-200">
                    <Link href={buildPaperHref(post.paper)}>
                      打開 paper hub
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <div className="space-y-4">
                <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                  Related discussions
                </p>
                {relatedPosts.map((relatedPost) => (
                  <ForumPostCard key={relatedPost.id} post={relatedPost} compact />
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
