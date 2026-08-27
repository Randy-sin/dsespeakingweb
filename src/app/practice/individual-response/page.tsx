import Link from "next/link";
import { ArrowRight, Clock3, Mic2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PracticeFlow } from "@/components/learning/practice-flow";
import { SiteFooter } from "@/components/layout/site-footer";
import { irLessons } from "@/lib/learning/content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "DSE Individual Response 錄音練習",
  description:
    "使用 DSE Speaking Part B 題目完成一分鐘準備和個人回應錄音，校對逐字稿並取得證據化 AI 改進建議。",
  path: "/practice/individual-response",
});

export default function IndividualResponsePracticePage() {
  return <div className="min-h-screen"><Navbar /><main id="main-content" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-7 lg:px-10 lg:py-20"><div className="grid gap-10 lg:grid-cols-12"><div className="lg:col-span-7"><p className="eyebrow text-[#ad3f29]">Individual Response Practice</p><h1 className="display-title mt-5 text-6xl leading-[0.88] sm:text-7xl lg:text-[88px]">選一種題型，完整說一次。</h1><p className="mt-7 max-w-lg text-base leading-8 text-[#6d695f]">你會有 1 分鐘準備，之後錄製最長 1 分鐘答案。校對逐字稿後，可取得有文字證據的改進建議；不會生成虛假的官方分數。</p></div><aside className="paper-surface p-6 lg:col-span-4 lg:col-start-9"><Mic2 className="h-6 w-6 text-[#48634c]" /><p className="mt-6 font-serif text-2xl">練習節奏</p><div className="mt-5 space-y-3 text-sm text-[#6d695f]"><p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />60 秒準備</p><p className="flex items-center gap-2"><Mic2 className="h-4 w-4" />最多 60 秒錄音</p></div></aside></div><PracticeFlow /><section className="mt-12 grid gap-px border border-[#bdb3a2] bg-[#bdb3a2] md:grid-cols-2 xl:grid-cols-5">{irLessons.map((lesson) => <Link key={lesson.slug} href={`/practice/individual-response/session?type=${lesson.slug}`} className="group flex min-h-72 flex-col bg-[#faf7ef] p-6 transition-colors hover:bg-[#e8e0cf]"><span className="eyebrow text-[#ad3f29]">TYPE {lesson.number}</span><h2 className="mt-8 font-serif text-3xl leading-tight">{lesson.englishTitle}</h2><p className="mt-3 text-sm leading-6 text-[#6d695f]">{lesson.summary}</p><div className="mt-auto flex items-center justify-between border-t border-[#bdb3a2] pt-4 text-xs font-semibold">開始練習<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div></Link>)}</section></main><SiteFooter /></div>;
}
