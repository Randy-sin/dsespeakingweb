import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LessonPage } from "@/components/learning/lesson-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getLesson, irLessons } from "@/lib/learning/content";
import { absoluteUrl, buildPageMetadata, SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

type Props = { params: Promise<{ lessonSlug: string }> };

export function generateStaticParams() {
  return irLessons.map((lesson) => ({ lessonSlug: lesson.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = getLesson("individual-response", lessonSlug);
  if (!lesson) return {};

  return buildPageMetadata({
    title: `${lesson.title}｜DSE Individual Response`,
    description: `${lesson.summary} 用約 ${lesson.duration} 分鐘掌握 ${lesson.englishTitle}，並完成一段 DSE Speaking 個人回應練習。`,
    path: `/learn/individual-response/${lesson.slug}`,
    type: "article",
  });
}

export default async function IndividualResponseLessonPage({ params }: Props) {
  const { lessonSlug } = await params;
  const lesson = getLesson("individual-response", lessonSlug);
  if (!lesson) notFound();
  const url = absoluteUrl(`/learn/individual-response/${lesson.slug}`);
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
        name: "DSE Individual Response 個人回應技巧",
        url: absoluteUrl("/learn/individual-response"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "學習路徑", item: absoluteUrl("/learn") },
        { "@type": "ListItem", position: 2, name: "Individual Response", item: absoluteUrl("/learn/individual-response") },
        { "@type": "ListItem", position: 3, name: lesson.title, item: url },
      ],
    },
  ];

  return <div className="min-h-screen"><JsonLd data={jsonLd} /><Navbar /><LessonPage lesson={lesson} /><SiteFooter /></div>;
}
