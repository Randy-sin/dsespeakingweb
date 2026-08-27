import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CoursePage } from "@/components/learning/course-page";
import { gdLessons } from "@/lib/learning/content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "DSE Group Discussion 小組討論技巧",
  description:
    "學習 DSE Speaking Group Discussion 的開場、回應、展開、禮貌反駁、邀請組員、轉題與總結技巧。",
  path: "/learn/group-discussion",
});

export default function GroupDiscussionCoursePage() { return <div className="min-h-screen"><Navbar /><CoursePage mode="group-discussion" lessons={gdLessons} /><SiteFooter /></div>; }
