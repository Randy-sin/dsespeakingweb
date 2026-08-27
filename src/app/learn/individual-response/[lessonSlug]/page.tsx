import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LessonPage } from "@/components/learning/lesson-page";
import { getLesson } from "@/lib/learning/content";

export default async function IndividualResponseLessonPage({ params }: { params: Promise<{ lessonSlug: string }> }) {
  const { lessonSlug } = await params;
  const lesson = getLesson("individual-response", lessonSlug);
  if (!lesson) notFound();
  return <div className="min-h-screen"><Navbar /><LessonPage lesson={lesson} /><SiteFooter /></div>;
}
