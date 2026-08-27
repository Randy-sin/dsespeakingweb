import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" className="mx-auto grid min-h-[70vh] max-w-[1200px] items-center px-4 py-16 sm:px-7 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="eyebrow text-[#ad3f29]">Page not found · 404</p>
            <h1 className="display-title mt-5 max-w-3xl text-6xl leading-[0.9] sm:text-8xl">這一頁不在練習路徑裡。</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#665f55]">連結可能已更新，或者這份真題尚未收錄。返回真題庫或學習路徑，就可以繼續下一個可用任務。</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/papers" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#172019] px-6 text-sm font-semibold text-white"><BookOpenText className="mr-2 h-4 w-4" />返回真題庫</Link>
              <Link href="/learn" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#9f9687] px-6 text-sm font-semibold"><ArrowLeft className="mr-2 h-4 w-4" />返回學習路徑</Link>
            </div>
          </div>
          <aside className="paper-surface paper-rule p-7">
            <p className="eyebrow text-[#48634c]">Keep moving</p>
            <p className="mt-5 font-serif text-2xl leading-9">找不到頁面不會影響已儲存在本機或帳戶內的學習進度。</p>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
