import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { IndividualResponseSession } from "@/features/practice/individual-response-session";
import { getLesson, irLessons } from "@/lib/learning/content";
import { createPublicClient } from "@/lib/supabase/public-server";
import type { Lesson } from "@/lib/learning/types";

type PartBQuestion = { text?: string } | string;

function lessonForQuestion(question: string) {
  const value = question.trim().toLowerCase();
  if (/^(which|would you prefer|do you prefer)/.test(value)) return irLessons[0];
  if (/^(how|what can|what should)/.test(value)) return irLessons[1];
  if (/^(describe|tell us about)/.test(value)) return irLessons[2];
  if (/^why/.test(value)) return irLessons[3];
  return irLessons[4];
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function IndividualResponseSessionPage({ searchParams }: { searchParams: Promise<{ type?: string; paperId?: string; question?: string }> }) {
  const { type, paperId, question } = await searchParams;
  let lesson: Lesson = (type && getLesson("individual-response", type)) || irLessons[0];
  let databasePaperId: string | undefined;
  let returnHref: string | undefined;
  let returnLabel: string | undefined;

  if (paperId && paperId.length <= 100) {
    const { data: paper } = await createPublicClient()
      .from("pastpaper_papers")
      .select("id,paper_id,paper_number,year,topic,part_b_questions")
      .eq("paper_id", paperId)
      .maybeSingle();
    const questions = Array.isArray(paper?.part_b_questions) ? (paper.part_b_questions as PartBQuestion[]) : [];
    const requestedIndex = Number.parseInt(question ?? "0", 10);
    const questionIndex = Number.isFinite(requestedIndex) && requestedIndex >= 0 && requestedIndex < questions.length ? requestedIndex : 0;
    const rawQuestion = questions[questionIndex];
    const questionText = typeof rawQuestion === "string" ? rawQuestion : rawQuestion?.text;
    if (paper && questionText?.trim()) {
      const baseLesson = lessonForQuestion(questionText);
      lesson = {
        ...baseLesson,
        slug: `paper-${paper.paper_id}-${questionIndex + 1}`,
        title: "真題個人回應",
        englishTitle: `${paper.year} ${paper.paper_number} · Part B Question ${questionIndex + 1}`,
        summary: `${paper.topic} 真題練習`,
        prompt: questionText.trim(),
      };
      databasePaperId = paper.id;
      returnHref = `/papers/${paper.paper_id}`;
      returnLabel = "返回這份真題";
    }
  }

  return <div className="min-h-screen"><Navbar /><IndividualResponseSession lesson={lesson} paperId={databasePaperId} returnHref={returnHref} returnLabel={returnLabel} /></div>;
}
