import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CoursePage } from "@/components/learning/course-page";
import { irLessons } from "@/lib/learning/content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "DSE Individual Response 個人回應技巧",
  description:
    "掌握 DSE Speaking Individual Response 的選擇、建議、個人經驗、原因分析與意見題答題結構。",
  path: "/learn/individual-response",
});

export default function IndividualResponseCoursePage() { return <div className="min-h-screen"><Navbar /><CoursePage mode="individual-response" lessons={irLessons} /><SiteFooter /></div>; }
