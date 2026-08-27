import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildPageMetadata,
  DEFAULT_DESCRIPTION,
  SITE_ORIGIN,
  truncateSeoText,
  websiteJsonLd,
} from "./seo";

describe("SEO metadata", () => {
  it("builds absolute canonical and social URLs from one page path", () => {
    const metadata = buildPageMetadata({
      title: "Group Discussion",
      description: "Learn how to respond and build on a classmate's idea.",
      path: "/learn/group-discussion",
    });

    expect(metadata.alternates?.canonical).toBe(`${SITE_ORIGIN}/learn/group-discussion`);
    expect(metadata.openGraph).toMatchObject({
      url: `${SITE_ORIGIN}/learn/group-discussion`,
      title: "Group Discussion",
      siteName: "DSE Speaking",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("keeps noindex pages out while preserving large previews for public pages", () => {
    const hidden = buildPageMetadata({
      title: "Private practice",
      description: "Private practice session.",
      path: "/practice/session",
      index: false,
    });
    const publicPage = buildPageMetadata({
      title: "Public lesson",
      description: "Public lesson.",
      path: "/learn/lesson",
    });

    expect(hidden.robots).toMatchObject({ index: false, follow: false });
    expect(publicPage.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { "max-image-preview": "large" },
    });
  });

  it("normalises long search snippets without breaking the configured origin", () => {
    expect(truncateSeoText("A   title with   spaces", 50)).toBe("A title with spaces");
    expect(truncateSeoText("A".repeat(80), 12)).toBe(`${"A".repeat(11)}…`);
    expect(absoluteUrl("/papers")).toBe(`${SITE_ORIGIN}/papers`);
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(websiteJsonLd.url).toBe(SITE_ORIGIN);
  });
});
