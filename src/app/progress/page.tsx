import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProgressPage } from "@/features/learning-path/progress-page";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ProgressRoute() { return <div className="min-h-screen"><Navbar /><ProgressPage /><SiteFooter /></div>; }
