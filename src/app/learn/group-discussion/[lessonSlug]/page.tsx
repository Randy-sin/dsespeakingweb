import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LessonPage } from "@/components/learning/lesson-page";
import { JsonLd } from "@/components/seo/json-ld";
import { gdLessons, getLesson } from "@/lib/learning/content";
import { absoluteUrl, buildPageMetadata, SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

type Props = { params: Promise<{ lessonSlug: string }> };

export function generateStaticParams() {
  return gdLessons.map((lesson) => ({ lessonSlug: lesson.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = getLesson("group-discussion", lessonSlug);
  if (!lesson) return {};

  return buildPageMetadata({
    title: `${lesson.title}｜DSE Group Discussion`,
    description: `${lesson.summary} 用約 ${lesson.duration} 分鐘掌握 ${lesson.englishTitle}，並完成一段 DSE Speaking 小組討論練習。`,
    path: `/learn/group-discussion/${lesson.slug}`,
    type: "article",
  });
}

export default async function GroupDiscussionLessonPage({ params }: Props) {
  const { lessonSlug } = await params;
  const lesson = getLesson("group-discussion", lessonSlug);
  if (!lesson) notFound();
  const url = absoluteUrl(`/learn/group-discussion/${lesson.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "@id": `${url}#lesson`,
      name: lesson.title,
      alternateName: lesson.englishTitle,
      description: lesson.summary,
      url,
      inLanguage: ["zh-Hant-HK", "en-HK"],
      educationalLevel: "HKDSE",
      educationalUse: "instruction",
      learningResourceType: "lesson",
      timeRequired: `PT${lesson.duration}M`,
      teaches: lesson.skill,
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
      isPartOf: {
        "@type": "CollectionPage",
        name: "DSE Group Discussion 小組討論技巧",
        url: absoluteUrl("/learn/group-discussion"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "學習路徑", item: absoluteUrl("/learn") },
        { "@type": "ListItem", position: 2, name: "Group Discussion", item: absoluteUrl("/learn/group-discussion") },
        { "@type": "ListItem", position: 3, name: lesson.title, item: url },
      ],
    },
  ];

  return <div className="min-h-screen"><JsonLd data={jsonLd} /><Navbar /><LessonPage lesson={lesson} /><SiteFooter /></div>;
}
