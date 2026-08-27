import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DSE Speaking｜HKDSE English Paper 4 口試教學",
    short_name: "DSE Speaking",
    description:
      "學習 Group Discussion 與 Individual Response，使用歷屆真題練習並取得 AI 證據化回饋。",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe4",
    theme_color: "#172019",
    lang: "zh-Hant-HK",
    categories: ["education"],
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
