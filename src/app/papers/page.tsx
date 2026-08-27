import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PaperCard } from "@/components/papers/paper-card";
import { fetchPaperCatalog } from "@/lib/forum/server";
import { Search, LibraryBig, ArrowRight } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "DSE Speaking Past Paper 歷屆口試真題",
  description:
    "瀏覽 HKDSE English Paper 4 歷屆 Speaking Past Paper，查看 Part A Group Discussion 和 Part B Individual Response 題目並直接練習。",
  path: "/papers",
});

type SearchParams = Promise<{
  q?: string;
  year?: string;
  sort?: "latest" | "trending";
  page?: string;
}>;

export default async function PapersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = params.sort ?? "latest";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const catalog = await fetchPaperCatalog({
    query: params.q,
    year: params.year,
    sort,
    page,
    pageSize: 24,
  });

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  const firstResult = catalog.total === 0 ? 0 : (catalog.page - 1) * catalog.pageSize + 1;
  const lastResult = Math.min(catalog.total, catalog.page * catalog.pageSize);
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.year && params.year !== "all") query.set("year", params.year);
    if (sort !== "latest") query.set("sort", sort);
    if (nextPage > 1) query.set("page", String(nextPage));
    const value = query.toString();
    return value ? `/papers?${value}` : "/papers";
  };

  return (
    <div className="min-h-screen bg-[#f3efe4]">
      <Navbar />

      <main id="main-content">
      <section className="border-b border-[#bdb3a2] bg-[#48634c] text-[#faf7ef]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="eyebrow text-[#ced6cf]">
                Papers Archive
              </p>
              <h1 className="display-title mt-4 max-w-3xl text-[48px] leading-[0.9] sm:text-[72px]">
                真題不是收藏品，
                <br />
                要用來開口練習。
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#dce3dc]">
                先看題目需要哪一種能力，再學方法、準備關鍵詞，最後進入 Part A 或 Part B 計時練習。
              </p>
            </div>

            <div className="border border-white/30 bg-[#f3efe4] p-6 text-[#172019]">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-600">
                    Archive
                  </p>
                  <p className="mt-3 text-[26px] font-serif text-neutral-950">
                    {catalog.total}
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    可瀏覽的 speaking papers
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-600">
                    This page
                  </p>
                  <p className="mt-3 text-[26px] font-serif text-neutral-950">
                    {catalog.papers.filter((paper) => paper.discussionCount > 0).length}
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    本頁有討論的題組
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 text-[14px] leading-7 text-neutral-600">
                建議用法：選一份題目，先判斷所需技巧，再完成一次 Part A 回應和一次 Part B 錄音。
              </div>
            </div>
          </div>

          <div className="mt-8 border border-white/30 bg-[#172019] p-6 text-white sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-neutral-500">
                  2026 Special Page
                </p>
                <h2 className="mt-3 font-serif text-[30px] leading-none text-white">
                  2026 DSE Speaking Past Paper 最全整理
                </h2>
                <p className="mt-4 max-w-2xl text-[14px] leading-7 text-neutral-300">
                  按 Part A 與 Part B 整理考生分享題目，並直接連到相應的學習和練習流程。
                </p>
              </div>
              <Button asChild className="h-11 rounded-full bg-white px-6 text-[14px] text-neutral-900 hover:bg-neutral-100">
                <Link href="/papers/2026-speaking">
                  打開 2026 專頁
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <form className="mt-10 grid gap-3 rounded-[28px] border border-neutral-200/80 bg-[#faf9f5] p-4 sm:grid-cols-[1.6fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <label htmlFor="paper-search" className="sr-only">搜尋真題</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
              <input
                id="paper-search"
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="搜尋年份、paper number、topic 或 Part A 標題..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-[14px] text-neutral-700 outline-none transition focus:border-neutral-300"
              />
            </div>
            <label htmlFor="paper-year" className="sr-only">按年份篩選</label>
            <select
              id="paper-year"
              name="year"
              defaultValue={params.year ?? "all"}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-[14px] text-neutral-600 outline-none"
            >
              <option value="all">全部年份</option>
              {catalog.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <label htmlFor="paper-sort" className="sr-only">真題排序方式</label>
            <select
              id="paper-sort"
              name="sort"
              defaultValue={sort}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-[14px] text-neutral-600 outline-none"
            >
              <option value="latest">按年份排序</option>
              <option value="trending">按討論熱度排序</option>
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

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {!catalog.forumReady && (
          <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 text-[14px] leading-7 text-amber-900">
            真題頁已經可以使用；如果你還沒執行論壇 migration，討論數和互動功能會先顯示為空，執行後就會自動接上。
          </div>
        )}

        {catalog.papers.length === 0 ? (
          <div className="rounded-[28px] border border-neutral-200/80 bg-white px-6 py-16 text-center">
            <LibraryBig className="mx-auto h-8 w-8 text-neutral-300" />
            <h2 className="mt-4 font-serif text-[28px] text-neutral-950">
              沒有找到符合條件的真題
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-neutral-500">
              可以試試改搜年份或 topic，或清除篩選查看全部真題。
            </p>
            <Button asChild className="mt-6 rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800">
              <Link href="/papers">
                清除篩選
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#665f55]">
              <p>顯示第 {firstResult}–{lastResult} 份，共 {catalog.total} 份真題</p>
              <p className="font-mono text-xs">PAGE {catalog.page} / {totalPages}</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {catalog.papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav aria-label="真題分頁" className="mt-8 flex items-center justify-between gap-4 border-t border-[#bdb3a2] pt-6">
                {catalog.page > 1 ? <Link href={pageHref(catalog.page - 1)} rel="prev" className="inline-flex min-h-11 items-center rounded-full border border-[#9f9687] px-5 text-sm font-semibold">上一頁</Link> : <span />}
                <span className="text-sm text-[#665f55]">第 {catalog.page} / {totalPages} 頁</span>
                {catalog.page < totalPages ? <Link href={pageHref(catalog.page + 1)} rel="next" className="inline-flex min-h-11 items-center rounded-full bg-[#172019] px-5 text-sm font-semibold text-white">下一頁</Link> : <span />}
              </nav>
            ) : null}
          </>
        )}
      </div>
      </main>
    </div>
  );
}
