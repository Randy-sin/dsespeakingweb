import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CoursePage } from "@/components/learning/course-page";
import { irLessons } from "@/lib/learning/content";

export default function IndividualResponseCoursePage() { return <div className="min-h-screen"><Navbar /><CoursePage mode="individual-response" lessons={irLessons} /><SiteFooter /></div>; }
