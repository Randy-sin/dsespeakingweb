import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LearningDashboard } from "@/features/learning-path/learning-dashboard";

export default function LearnPage() {
  return <div className="min-h-screen bg-[#f3efe4]"><Navbar /><LearningDashboard /><SiteFooter /></div>;
}
