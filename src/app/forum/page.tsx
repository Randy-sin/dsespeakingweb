import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { ForumPostCard } from "@/components/forum/forum-post-card";
import { fetchForumFeed, fetchForumTags, fetchPaperCatalog } from "@/lib/forum/server";
import { FORUM_POST_TYPE_OPTIONS } from "@/lib/forum/constants";
import { Search, MessageSquareText, Sparkles, ArrowRight, Flame } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  sort?: "latest" | "active" | "popular";
  type?: "all" | "paper_discussion" | "part_a_analysis" | "part_b_idea" | "mock_review" | "exam_tips";
  tag?: string;
}>;

export default async function ForumPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = params.sort ?? "active";
  const postType = params.type ?? "all";

  const [feed, tagsRes, papersRes] = await Promise.all([
    fetchForumFeed({
      query: params.q,
      sort,
      postType,
      tag: params.tag,
    }),
    fetchForumTags(),
    fetchPaperCatalog({ sort: "trending", limit: 5 }),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Navbar />

      <section className="border-b border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="text-[12px] uppercase tracking-[0.22em] text-neutral-400">
                DSE Speaking Forum
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-[40px] leading-[0.94] text-neutral-950 sm:text-[64px]">
                這一週最值得看的
                <br />
                speaking 討論中心
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-neutral-600">
                把真題、Part A 拆解、Part B 答法、模擬復盤集中在同一個地方。每一篇討論都盡量貼近考前真正需要看的東西。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/forum/new">
                  <Button className="h-11 rounded-full bg-neutral-900 px-6 text-[14px] text-white hover:bg-neutral-800">
                    發佈討論
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/papers">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-neutral-200 px-6 text-[14px] text-neutral-600"
                  >
                    先看真題庫
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200/80 bg-[#faf9f5] p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-400">
                    Hot now
                  </p>
                  <p className="mt-3 text-[26px] font-serif text-neutral-950">
                    {feed.posts.length}
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    當前可看的公開討論
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-400">
                    Papers
                  </p>
                  <p className="mt-3 text-[26px] font-serif text-neutral-950">
                    {papersRes.papers.length}
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    正在被討論的真題入口
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-800">
                  <Sparkles className="h-4 w-4" />
                  這週討論方向
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tagsRes.tags.slice(0, 5).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/forum?tag=${tag.slug}`}
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form className="mt-10 grid gap-3 rounded-[28px] border border-neutral-200/80 bg-[#faf9f5] p-4 sm:grid-cols-[1.5fr_0.7fr_0.7fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="搜尋真題年份、paper number、關鍵字或作者..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-[14px] text-neutral-700 outline-none transition focus:border-neutral-300"
              />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-[14px] text-neutral-600 outline-none"
            >
              <option value="active">最近最活躍</option>
              <option value="popular">最多互動</option>
              <option value="latest">最新發布</option>
            </select>
            <select
              name="type"
              defaultValue={postType}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-[14px] text-neutral-600 outline-none"
            >
              <option value="all">全部類型</option>
              {FORUM_POST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              className="h-12 rounded-2xl bg-neutral-900 px-6 text-[14px] text-white hover:bg-neutral-800"
            >
              篩選
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.45fr]">
        <div className="space-y-5">
          {!feed.forumReady && (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 text-[14px] leading-7 text-amber-900">
              論壇資料表尚未套用到目前的 Supabase 環境，頁面已經準備好，但發帖、收藏與留言要等 migration 執行後才會完整啟用。
            </div>
          )}

          {feed.posts.length === 0 ? (
            <div className="rounded-[28px] border border-neutral-200/80 bg-white p-10 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-neutral-300" />
              <h2 className="mt-4 font-serif text-[28px] text-neutral-950">
                還沒有符合條件的討論
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-neutral-500">
                可以先從真題頁發第一篇帖，或把剛練完的一次房間復盤整理成一篇具體的討論。
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/forum/new">
                  <Button className="rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800">
                    發佈第一篇
                  </Button>
                </Link>
                <Link href="/papers">
                  <Button variant="outline" className="rounded-full border-neutral-200 px-5">
                    瀏覽真題
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            feed.posts.map((post) => <ForumPostCard key={post.id} post={post} />)
          )}
        </div>

        <aside className="space-y-5">
          {/* 2026 Banner */}
          <Link
            href="/papers/2026-speaking"
            className="block rounded-[28px] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 p-6 shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 mb-3">
              <Flame className="h-6 w-6 text-white" />
              <p className="text-[12px] uppercase tracking-[0.18em] text-white/80">
                Hot Now
              </p>
            </div>
            <h3 className="font-serif text-[22px] font-semibold text-white mb-2">
              2026 Speaking 題目
            </h3>
            <p className="text-[13px] text-white/80 leading-relaxed mb-4">
              Paper 1.1, 1.2, 1.3 已收錄，Part B 題目持續更新中
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-medium text-white">
              查看題目
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6">
            <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
              Top Papers This Week
            </p>
            <div className="mt-5 space-y-3">
              {papersRes.papers.map((paper) => (
                <Link
                  key={paper.id}
                  href={`/papers/${paper.paper_id}`}
                  className="block rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4 transition-colors hover:border-neutral-200 hover:bg-white"
                >
                  <p className="text-[12px] text-neutral-400">
                    {paper.year} · {paper.paper_number}
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-6 text-neutral-900">
                    {paper.topic}
                  </p>
                  <p className="mt-2 text-[12px] text-neutral-500">
                    {paper.discussionCount} 則討論
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6">
            <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
              Popular Tags
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tagsRes.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/forum?tag=${tag.slug}`}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
