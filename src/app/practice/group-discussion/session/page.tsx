import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Check, MessageCircleMore } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PracticeCoach } from "@/features/practice/practice-coach";
import { createPublicClient } from "@/lib/supabase/public-server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const topics = {
  reading: {
    title: "Promoting a reading culture",
    starter: "The school should give prizes to students who read the most books.",
    move: "Respond to the idea, add one new consideration, then invite another view.",
    sourceLabel: "A classmate says",
  },
  wellbeing: {
    title: "A healthier school day",
    starter: "The school should cancel all homework on Fridays.",
    move: "Respond, identify one limitation, then propose a practical alternative.",
    sourceLabel: "A classmate says",
  },
  visit: {
    title: "Planning a school visit",
    starter: "We should visit a theme park because it is popular.",
    move: "Respond and connect the discussion back to its learning value.",
    sourceLabel: "A classmate says",
  },
};

type DiscussionTopic = (typeof topics)[keyof typeof topics];

export default async function GroupDiscussionSessionPage({ searchParams }: { searchParams: Promise<{ topic?: string; paperId?: string }> }) {
  const { topic, paperId } = await searchParams;
  let selected: DiscussionTopic = topics[(topic as keyof typeof topics) || "reading"] || topics.reading;
  let databasePaperId: string | undefined;
  let returnHref = "/practice/group-discussion";
  let returnLabel = "重新選題";

  if (paperId && paperId.length <= 100) {
    const { data: paper } = await createPublicClient()
      .from("pastpaper_papers")
      .select("id,paper_id,paper_number,year,topic,part_a_title,part_a_discussion_points")
      .eq("paper_id", paperId)
      .maybeSingle();
    if (paper) {
      selected = {
        title: `${paper.year} ${paper.paper_number} · ${paper.topic}`,
        starter: paper.part_a_title,
        move: paper.part_a_discussion_points[0] ?? "Respond to the focus, add a new consideration, then invite another view.",
        sourceLabel: "Past paper focus",
      };
      databasePaperId = paper.id;
      returnHref = `/papers/${paper.paper_id}`;
      returnLabel = "返回這份真題";
    }
  }

  const task = `${selected.sourceLabel}: “${selected.starter}” ${selected.move}`;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-7 lg:px-10">
        <Link href={returnHref} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-[#6d695f]"><ArrowLeft className="h-4 w-4" />{returnLabel}</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="eyebrow text-[#48634c]">Guided simulation</p>
            <h1 className="mt-3 font-serif text-[38px] leading-tight sm:text-5xl">{selected.title}</h1>
            <div className="mt-5 border border-[#bdb3a2] bg-[#faf7ef] p-5 sm:p-6">
              <p className="eyebrow text-[#665f55]">{selected.sourceLabel}</p>
              <blockquote className="mt-3 font-serif text-xl leading-8 text-[#26352a] sm:text-2xl">“{selected.starter}”</blockquote>
            </div>
            <div className="mt-5 border-l-2 border-[#ad3f29] pl-5">
              <p className="eyebrow text-[#665f55]">Your move</p>
              <p className="mt-2 text-base leading-7 text-[#4f4b44]">{selected.move}</p>
              <p className="mt-3 text-xs leading-5 text-[#665f55]">You mentioned … → I agree / I see the point, but … → Add one reason or example → Invite a response.</p>
            </div>
            <div className="mt-6"><PracticeCoach maxSeconds={45} mode="group-discussion" task={task} paperId={databasePaperId} /></div>
          </section>
          <aside className="space-y-4">
            <div className="paper-surface paper-rule p-6"><MessageCircleMore className="h-5 w-5 text-[#48634c]" /><p className="mt-5 font-serif text-2xl">完成標準</p><ul className="mt-5 space-y-3 text-sm leading-6 text-[#6d695f]">{["點出上一位同學的具體觀點", "清楚表明同意、補充或反駁", "加入新的原因、例子或限制", "留下讓別人接話的位置"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#48634c]" />{item}</li>)}</ul></div>
            <p className="border-l border-[#ad3f29] pl-4 text-xs leading-6 text-[#665f55]">登入後可讓 AI 組員針對你逐字稿中的具體觀點接話。它只負責延續討論，不會冒充考官或給出官方分數。</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
