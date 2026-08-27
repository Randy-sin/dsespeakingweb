import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Newsreader, Noto_Sans_TC } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { LearningSync } from "@/components/learning/learning-sync";
import "./globals.css";

const bodyFont = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DSE Speaking — Learn it. Say it better.",
    template: "%s | DSE Speaking",
  },
  description:
    "學懂 DSE English Paper 4 的答題方法，練習 Group Discussion 與 Individual Response，並獲得具體改進方向。",
  metadataBase: new URL("https://www.dsespeaking.com"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3EFE4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
        <a className="skip-link" href="#main-content">
          跳到主要內容
        </a>
        {children}
        <LearningSync />
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
