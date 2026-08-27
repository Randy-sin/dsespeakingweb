import Link from "next/link";
import { ArrowLeft, Check, MessageCircleMore } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PracticeCoach } from "@/features/practice/practice-coach";

const topics = {
  reading: { title: "Promoting a reading culture", prompt: "A classmate says: ‘The school should give prizes to students who read the most books.’ Respond to the idea, add a new consideration, and invite another view." },
  wellbeing: { title: "A healthier school day", prompt: "A classmate suggests cancelling all homework on Fridays. Respond, identify one limitation, and propose a practical alternative." },
  visit: { title: "Planning a school visit", prompt: "A classmate recommends visiting a theme park because it is popular. Respond and connect the discussion back to learning value." },
};

export default async function GroupDiscussionSessionPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const selected = topics[(topic as keyof typeof topics) || "reading"] || topics.reading;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-7 lg:px-10">
        <Link href="/practice/group-discussion" className="inline-flex items-center gap-2 text-sm text-[#6d695f]"><ArrowLeft className="h-4 w-4" />重新選題</Link>
        <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="eyebrow text-[#48634c]">Guided simulation · {selected.title}</p>
            <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">{selected.prompt}</h1>
            <div className="mt-8 border-l border-[#c84b31] pl-5"><p className="eyebrow text-[#8a8175]">Your move</p><p className="mt-3 text-sm leading-7 text-[#6d695f]">You mentioned … → I agree / I see the point, but … → Add one reason or example → Invite a response.</p></div>
            <div className="mt-10"><PracticeCoach maxSeconds={45} mode="group-discussion" task={selected.prompt} /></div>
          </section>
          <aside className="space-y-4">
            <div className="paper-surface paper-rule p-6"><MessageCircleMore className="h-5 w-5 text-[#48634c]" /><p className="mt-5 font-serif text-2xl">完成標準</p><ul className="mt-5 space-y-3 text-sm leading-6 text-[#6d695f]">{["點出上一位同學的具體觀點", "清楚表明同意、補充或反駁", "加入新的原因、例子或限制", "留下讓別人接話的位置"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#48634c]" />{item}</li>)}</ul></div>
            <p className="border-l border-[#c84b31] pl-4 text-xs leading-6 text-[#8a8175]">登入後可讓 AI 組員針對你逐字稿中的具體觀點接話。它只負責延續討論，不會冒充考官或給出官方分數。</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
