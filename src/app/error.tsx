"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error", error.digest ?? error.name);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto grid min-h-screen max-w-[1000px] place-items-center px-5 py-16">
      <section className="w-full border border-[#bdb3a2] bg-[#faf7ef] p-7 sm:p-10">
        <p className="eyebrow text-[#ad3f29]">Something interrupted the lesson</p>
        <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">這一步暫時未能載入。</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#665f55]">你的本機筆記和進度不會因這個錯誤被清除。可以先重試；若服務仍未恢復，返回學習路徑繼續其他短課。</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={reset} className="h-12 rounded-full bg-[#172019] px-6 text-white"><RotateCcw className="mr-2 h-4 w-4" />重試這一步</Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-[#9f9687] px-6"><Link href="/learn">返回學習路徑</Link></Button>
        </div>
      </section>
    </main>
  );
}
