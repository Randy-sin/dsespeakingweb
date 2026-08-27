import Link from "next/link";
import { ArrowRight, MessageCircleMore, TimerReset, UsersRound } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PracticeFlow } from "@/components/learning/practice-flow";
import { SiteFooter } from "@/components/layout/site-footer";

const prompts = [
  { id: "reading", title: "Promoting a reading culture", task: "Discuss how the school can encourage students to read more and decide which idea should be tried first." },
  { id: "wellbeing", title: "A healthier school day", task: "Discuss ways to reduce student stress and decide which proposal would be most practical." },
  { id: "visit", title: "Planning a school visit", task: "Discuss possible destinations, benefits and arrangements, then recommend one plan." },
];

export default function GroupDiscussionPracticePage() {
  return <div className="min-h-screen"><Navbar /><main id="main-content" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-7 lg:px-10 lg:py-20"><div className="grid gap-10 lg:grid-cols-12"><div className="lg:col-span-7"><p className="eyebrow text-[#48634c]">Group Discussion Practice</p><h1 className="display-title mt-5 text-6xl leading-[0.86] sm:text-8xl">練習推進討論，不是等候會議室。</h1><p className="mt-7 max-w-2xl text-base leading-8 text-[#6d695f]">選題後按提示練習回應、補充和邀請同學接話。登入後，AI 組員會針對你已校對的逐字稿延續討論；它不會假裝是真人或考官。</p></div><aside className="paper-surface p-6 lg:col-span-4 lg:col-start-9"><UsersRound className="h-6 w-6 text-[#48634c]" /><p className="mt-6 font-serif text-2xl">本次會練到</p><div className="mt-5 space-y-3 text-sm text-[#6d695f]"><p className="flex gap-2"><MessageCircleMore className="mt-0.5 h-4 w-4" />回應並加入新資訊</p><p className="flex gap-2"><TimerReset className="mt-0.5 h-4 w-4" />掌握準備與發言節奏</p></div></aside></div><PracticeFlow /><section className="mt-12 grid gap-5 lg:grid-cols-3">{prompts.map((prompt, index) => <Link key={prompt.id} href={`/practice/group-discussion/session?topic=${prompt.id}`} className="group flex min-h-80 flex-col border border-[#bdb3a2] bg-[#faf7ef] p-6 hover:border-[#48634c]"><span className="font-mono text-xs text-[#c84b31]">SET 0{index + 1}</span><h2 className="mt-10 font-serif text-3xl leading-tight">{prompt.title}</h2><p className="mt-5 text-sm leading-7 text-[#6d695f]">{prompt.task}</p><div className="mt-auto flex items-center justify-between border-t border-[#bdb3a2] pt-5 text-sm font-semibold">選擇這題<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div></Link>)}</section></main><SiteFooter /></div>;
}
