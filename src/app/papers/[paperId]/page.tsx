import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForumPostCard } from "@/components/forum/forum-post-card";
import { fetchPaperHub } from "@/lib/forum/server";
import { ArrowLeft, BookOpenText, MessageSquareText, Mic2 } from "lucide-react";

type Params = Promise<{ paperId: string }>;

type PartBQuestion = {
  number?: number;
  text?: string;
  difficulty?: string;
  difficulty_level?: string;
};

export default async function PaperHubPage({
  params,
}: {
  params: Params;
}) {
  const { paperId } = await params;
  const { paper, posts, forumReady } = await fetchPaperHub(paperId);

  if (!paper) {
    notFound();
  }

  const partBQuestions = Array.isArray(paper.part_b_questions)
    ? (paper.part_b_questions as PartBQuestion[])
    : [];

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Link
          href="/papers"
          className="inline-flex items-center gap-2 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回真題庫
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.45fr]">
          <section className="rounded-[32px] border border-neutral-200/80 bg-white p-7 shadow-[0_30px_120px_-52px_rgba(15,23,42,0.24)] sm:p-10">
            <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-neutral-400">
                  {paper.year} · {paper.paper_number}
                </p>
                <h1 className="mt-3 font-serif text-[34px] leading-none text-neutral-950 sm:text-[44px]">
                  {paper.topic}
                </h1>
                <p className="mt-4 text-[15px] leading-7 text-neutral-600">
                  {paper.part_a_title}
                </p>
              </div>

              <div className="flex gap-3">
                <Button asChild className="rounded-full bg-[#172019] px-5 text-white hover:bg-[#324036]">
                  <Link href="/learn/group-discussion/respond-and-build">
                    先學這題需要的技巧
                  </Link>
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="mt-8">
              <TabsList
                variant="line"
                className="w-full justify-start overflow-x-auto rounded-none border-b border-neutral-100 p-0"
              >
                <TabsTrigger value="overview" className="min-w-fit px-4 py-3 text-[13px]">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="part-a" className="min-w-fit px-4 py-3 text-[13px]">
                  Part A
                </TabsTrigger>
                <TabsTrigger value="part-b" className="min-w-fit px-4 py-3 text-[13px]">
                  Part B
                </TabsTrigger>
                <TabsTrigger value="discussion" className="min-w-fit px-4 py-3 text-[13px]">
                  Discussion
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-neutral-200 bg-[#faf9f5] p-6">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                      Source
                    </p>
                    <p className="mt-3 text-[15px] leading-7 text-neutral-700">
                      {paper.part_a_source}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-neutral-200 bg-[#faf9f5] p-6">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                      Discussion activity
                    </p>
                    <p className="mt-3 font-serif text-[28px] text-neutral-950">
                      {posts.length}
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-neutral-500">
                      這份 paper 目前有 {posts.length} 篇公開討論，可以從整體分析一路看到 Part B 答法與模擬復盤。
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="part-a" className="pt-8">
                <div className="rounded-[28px] border border-neutral-200 bg-[#faf9f5] p-6">
                  {paper.page_images?.length ? (
                    <div className="space-y-4">
                      {paper.page_images.map((url: string, index: number) => (
                        <Image
                          key={url}
                          src={url}
                          alt={`Paper page ${index + 1}`}
                          width={1200}
                          height={1600}
                          unoptimized
                          className="w-full rounded-2xl border border-neutral-200 bg-white"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 text-[15px] leading-8 text-neutral-700">
                      {paper.part_a_article.map((paragraph: string, index: number) => (
                        <p key={`${paper.id}-paragraph-${index}`}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {paper.part_a_discussion_points.map((point: string, index: number) => (
                    <div
                      key={`${paper.id}-discussion-${index}`}
                      className="flex gap-4 rounded-[20px] border border-neutral-200 bg-white p-5"
                    >
                      <span className="font-mono text-[13px] text-neutral-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[15px] leading-7 text-neutral-700">{point}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="part-b" className="pt-8">
                <div className="space-y-3">
                  {partBQuestions.map((question, index) => (
                    <div
                      key={`${paper.id}-partb-${index}`}
                      className="rounded-[20px] border border-neutral-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-neutral-400">
                        <span>Question {question.number ?? index + 1}</span>
                        {question.difficulty && (
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-500">
                            {question.difficulty}
                          </span>
                        )}
                        {question.difficulty_level && (
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-500">
                            {question.difficulty_level}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-[15px] leading-7 text-neutral-700">
                        {question.text}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="pt-8">
                <div className="space-y-5">
                  {!forumReady && (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 text-[14px] leading-7 text-amber-900">
                      這個 paper hub 已經可用；等論壇 migration 套用後，這裡會開始顯示留言、收藏和同題討論。
                    </div>
                  )}

                  {posts.length === 0 ? (
                    <div className="rounded-[24px] border border-neutral-200 bg-[#faf9f5] p-8 text-center">
                      <MessageSquareText className="mx-auto h-8 w-8 text-neutral-300" />
                      <h2 className="mt-4 font-serif text-[26px] text-neutral-950">
                        這份真題還沒有討論
                      </h2>
                      <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-neutral-500">
                        如果你剛練完這題，現在就是最好的時候。把最卡的點、最想問的地方，或你自己的答法直接發成第一篇。
                      </p>
                      <Button asChild className="mt-6 rounded-full bg-neutral-900 px-5 text-white hover:bg-neutral-800">
                        <Link href={`/forum/new?paperId=${paper.id}&postType=paper_discussion`}>
                          寫第一篇同題帖
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    posts.map((post) => <ForumPostCard key={post.id} post={post} />)
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6">
              <p className="eyebrow text-[#8a8175]">
                Practice this paper
              </p>
              <div className="mt-5 space-y-3">
                <Button asChild variant="outline" className="w-full justify-start rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-6 text-left text-[14px] text-neutral-700">
                  <Link href="/learn/group-discussion">
                    <BookOpenText className="h-4 w-4" />
                    學習 Part A 互動方法
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-6 text-left text-[14px] text-neutral-700">
                  <Link href="/practice/group-discussion">
                    <Mic2 className="h-4 w-4" />
                    練習 Part A 小組討論
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start rounded-2xl border-neutral-200 bg-neutral-50 px-4 py-6 text-left text-[14px] text-neutral-700">
                  <Link href="/practice/individual-response">
                    <Mic2 className="h-4 w-4" />
                    練習 Part B 個人回應
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-400">
                Paper Summary
              </p>
              <div className="mt-5 space-y-3 text-[14px] leading-7 text-neutral-600">
                <p>
                  年份：<span className="text-neutral-900">{paper.year}</span>
                </p>
                <p>
                  試卷：<span className="text-neutral-900">{paper.paper_number}</span>
                </p>
                <p>
                  Part A 討論點：
                  <span className="text-neutral-900">
                    {" "}
                    {paper.part_a_discussion_points.length}
                  </span>
                </p>
                <p>
                  Part B 問題：
                  <span className="text-neutral-900"> {partBQuestions.length}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
