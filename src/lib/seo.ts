import type { Metadata } from "next";

export const SITE_NAME = "DSE Speaking";
export const SITE_ORIGIN = "https://www.dsespeaking.com";
export const DEFAULT_DESCRIPTION =
  "免費學習 HKDSE English Paper 4 口試技巧：Group Discussion、Individual Response、歷屆真題、錄音逐字稿與 AI 證據化回饋。";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  type?: "website" | "article";
};

export function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString();
}

export function truncateSeoText(value: string, maxLength: number) {
  const normalised = value.replace(/\s+/g, " ").trim();
  if (normalised.length <= maxLength) return normalised;
  return `${normalised.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  index = true,
  type = "website",
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      locale: "zh_HK",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_ORIGIN}/#website`,
  url: SITE_ORIGIN,
  name: SITE_NAME,
  alternateName: "HKDSE English Paper 4 Speaking",
  description: DEFAULT_DESCRIPTION,
  inLanguage: ["zh-Hant-HK", "en-HK"],
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
  },
};
