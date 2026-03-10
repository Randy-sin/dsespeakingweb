import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PaperCard } from "@/components/papers/paper-card";
import { fetchPaperCatalog } from "@/lib/forum/server";
import { Search, LibraryBig, ArrowRight } from "lucide-react";

type SearchParams = Promise<{
  q?: string;
  year?: string;
  sort?: "latest" | "trending";
}>;

export default async function PapersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sort = params.sort ?? "latest";
  const catalog = await fetchPaperCatalog({
    query: params.q,
    year: params.year,
    sort,
  });

  const years = Array.from(new Set(catalog.papers.map((paper) => paper.year))).sort(
    (a, b) => b - a
  );

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Navbar />

      <section className="border-b border-neutral-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[12px] uppercase tracking-[0.22em] text-neutral-400">
                Papers Archive
              </p>
              <h1 className="mt-4 max-w-3xl font-serif text-[40px] leading-[0.94] text-neutral-950 sm:text-[64px]">
                真題庫，不只用來選題，
                <br />
                也用來聚集討論
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-neutral-600">
                每一份 speaking paper 都是一個討論入口。你可以先看題，再直接跳進別人對 Part A、Part B 和模擬復盤的討論。
              </p>
            </div>

            <div className="rounded-[28px] border border-neutral-200/80 bg-[#faf9f5] p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-400">
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
                  <p className="text-[12px] uppercase tracking-[0.15em] text-neutral-400">
                    Trending
                  </p>
                  <p className="mt-3 text-[26px] font-serif text-neutral-950">
                    {catalog.papers.filter((paper) => paper.discussionCount > 0).length}
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    有活躍討論的 paper
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 text-[14px] leading-7 text-neutral-600">
                考試周最好的使用方式是：先從年份或題目搜尋，快速看一次題，再打開對應 paper hub 看別人的思路與復盤。
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-neutral-200/80 bg-[#111111] p-6 text-white sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-neutral-500">
                  2026 Special Page
                </p>
                <h2 className="mt-3 font-serif text-[30px] leading-none text-white">
                  2026 DSE Speaking Past Paper 最全整理
                </h2>
                <p className="mt-4 max-w-2xl text-[14px] leading-7 text-neutral-300">
                  我另外做了一個單獨頁面，專門放 2026 Speaking 的 PDF、題目結構和後續整理。你一拿到 PDF，就可以直接補上去。
                </p>
              </div>
              <Link href="/papers/2026-speaking">
                <Button className="h-11 rounded-full bg-white px-6 text-[14px] text-neutral-900 hover:bg-neutral-100">
                  打開 2026 專頁
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <form className="mt-10 grid gap-3 rounded-[28px] border border-neutral-200/80 bg-[#faf9f5] p-4 sm:grid-cols-[1.6fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="搜尋年份、paper number、topic 或 Part A 標題..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-[14px] text-neutral-700 outline-none transition focus:border-neutral-300"
              />
            </div>
            <select
              name="year"
              defaultValue={params.year ?? "all"}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-[14px] text-neutral-600 outline-none"
            >
              <option value="all">全部年份</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
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
              可以試試改搜年份、topic，或直接回論壇看這週最熱門的討論。
            </p>
            <Link href="/forum" className="mt-6 inline-flex">
              <Button className="rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800">
                去論壇看看
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {catalog.papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
