import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CoursePage } from "@/components/learning/course-page";
import { gdLessons } from "@/lib/learning/content";

export default function GroupDiscussionCoursePage() { return <div className="min-h-screen"><Navbar /><CoursePage mode="group-discussion" lessons={gdLessons} /><SiteFooter /></div>; }
