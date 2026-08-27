import type { MetadataRoute } from "next";
import { fetchForumFeed, fetchPaperCatalog } from "@/lib/forum/server";
import { gdLessons, irLessons } from "@/lib/learning/content";
import { SITE_ORIGIN } from "@/lib/seo";

const CONTENT_RELEASE_DATE = new Date("2026-08-27T00:00:00+08:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    "/practice/group-discussion",
    "/practice/individual-response",
    "/forum",
    ...lessonRoutes,
  ];
  const [catalog, forum] = await Promise.all([
    fetchPaperCatalog({ sort: "latest", limit: 500 }),
    fetchForumFeed({ sort: "latest" }),
  ]);

  return [
    ...routes.map((route, index) => ({
      url: `${SITE_ORIGIN}${route}`,
      lastModified: CONTENT_RELEASE_DATE,
      changeFrequency: route === "/forum" ? "daily" as const : route.startsWith("/papers") ? "monthly" as const : "weekly" as const,
      priority: index === 0 ? 1 : route.includes("/learn/") ? 0.8 : 0.7,
    })),
    ...catalog.papers.map((paper) => ({
      url: `${SITE_ORIGIN}/papers/${paper.paper_id}`,
      lastModified: paper.updated_at ?? paper.created_at ?? CONTENT_RELEASE_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...forum.posts.map((post) => ({
      url: `${SITE_ORIGIN}/forum/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
