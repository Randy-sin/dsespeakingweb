import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { Toaster } from "@/components/ui/sonner";
import { LearningSync } from "@/components/learning/learning-sync";
import { JsonLd } from "@/components/seo/json-ld";
import { UserProvider } from "@/hooks/use-user";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_ORIGIN, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const displayFont = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DSE Speaking｜HKDSE English Paper 4 口試教學與練習",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3EFE4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-HK" data-scroll-behavior="smooth">
      <body className={displayFont.variable}>
        <JsonLd data={websiteJsonLd} />
        <UserProvider>
          <a className="skip-link" href="#main-content">
            跳到主要內容
          </a>
          {children}
          <LearningSync />
          <Toaster position="top-center" />
        </UserProvider>
        <AnalyticsProvider />
      </body>
    </html>
  );
}
