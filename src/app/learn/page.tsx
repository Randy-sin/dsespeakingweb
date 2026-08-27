import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LearningDashboard } from "@/features/learning-path/learning-dashboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "DSE Speaking 學習路徑",
  description:
    "按你的目標學習 HKDSE English Paper 4：先掌握小組討論與個人回應方法，再完成真題和計時口語練習。",
  path: "/learn",
});

export default function LearnPage() {
  return <div className="min-h-screen bg-[#f3efe4]"><Navbar /><LearningDashboard /><SiteFooter /></div>;
}
