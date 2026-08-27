import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/learn/", "/papers/"],
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/register",
        "/onboarding",
        "/practice/",
        "/progress",
        "/forum/new",
      ],
    },
    sitemap: "https://www.dsespeaking.com/sitemap.xml",
    host: "https://www.dsespeaking.com",
  };
}
