import type { MetadataRoute } from "next";
import { gdLessons, irLessons } from "@/lib/learning/content";

const ORIGIN = "https://www.dsespeaking.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lessonRoutes = [
    ...gdLessons.map((lesson) => `/learn/group-discussion/${lesson.slug}`),
    ...irLessons.map((lesson) => `/learn/individual-response/${lesson.slug}`),
  ];
  const routes = [
    "",
    "/learn",
    "/learn/group-discussion",
    "/learn/individual-response",
    "/papers",
    "/papers/2026-speaking",
    ...lessonRoutes,
  ];

  return routes.map((route, index) => ({
    url: `${ORIGIN}${route}`,
    changeFrequency: route.startsWith("/papers") ? "monthly" : "weekly",
    priority: index === 0 ? 1 : route.includes("/learn/") ? 0.8 : 0.7,
  }));
}
