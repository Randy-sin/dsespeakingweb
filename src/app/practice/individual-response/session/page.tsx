import { Navbar } from "@/components/layout/navbar";
import { IndividualResponseSession } from "@/features/practice/individual-response-session";
import { getLesson, irLessons } from "@/lib/learning/content";

export default async function IndividualResponseSessionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const lesson = (type && getLesson("individual-response", type)) || irLessons[0];
  return <div className="min-h-screen"><Navbar /><IndividualResponseSession lesson={lesson} /></div>;
}
