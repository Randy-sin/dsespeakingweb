import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Clock3,
  Database,
  EyeOff,
  LockKeyhole,
  Mic2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsPreferences } from "@/components/privacy/analytics-preferences";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "私隱與使用分析",
  description: "了解 DSE Speaking 的匿名使用分析、錄音與 AI 處理邊界，並管理這個瀏覽器的分析偏好。",
  path: "/privacy",
});

const noContentItems = [
  "錄音或音訊檔案",
  "逐字稿與作答內容",
  "練習題目、提示詞或 AI prompt",
  "電郵、用戶 ID 或其他帳戶識別資料",
  "IP 位址或完整 User-Agent",
];

const sections = [
  {
    number: "01",
    title: "我們用甚麼了解網站",
    icon: BarChart3,
  },
  {
    number: "02",
    title: "錄音、帳戶與 AI 的邊界",
    icon: Mic2,
  },
  {
    number: "03",
    title: "保留、停止與刪除限制",
    icon: Clock3,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f3efe4]">
      <Navbar />
      <main id="main-content">
        <header className="border-b border-[#cfc5b3]">
          <div className="mx-auto grid max-w-[1440px] gap-9 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:px-10 lg:py-24">
            <div className="lg:col-span-3">
              <p className="eyebrow text-[#665f55]">Privacy / 透明原則</p>
              <p className="mt-4 font-mono text-[11px] text-[#7a746a]">最後更新：2026-08-29</p>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <h1 className="display-title max-w-4xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
                只量度學習路徑，
                <span className="text-[#ad3f29]">不窺看你說了甚麼。</span>
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-[#5e5b53] sm:text-lg">
                我們用有限的匿名數據判斷學生是否真正開始說、完成練習，以及在哪一步遇到錯誤。分析資料與學習內容分開保存；錄音、逐字稿和答案不會進入功能埋點。
              </p>
              <div className="mt-10">
                <AnalyticsPreferences />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:px-10">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <p className="eyebrow text-[#665f55]">At a glance</p>
              <nav aria-label="私隱說明章節" className="mt-5 border-t border-[#cfc5b3]">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.number}
                      href={`#section-${section.number}`}
                      className="focus-ring flex min-h-14 items-center gap-3 border-b border-[#cfc5b3] py-3 text-sm text-[#4f4b44] transition-colors hover:text-[#ad3f29]"
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      <span>{section.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="space-y-16 lg:col-span-8 lg:col-start-5">
            <section id="section-01" aria-labelledby="section-01-title" className="scroll-mt-24">
              <div className="flex items-start gap-5 border-b border-[#cfc5b3] pb-5">
                <span className="font-mono text-xs text-[#ad3f29]">01</span>
                <div>
                  <p className="eyebrow text-[#665f55]">Measurement</p>
                  <h2 id="section-01-title" className="mt-2 font-serif text-3xl tracking-[-0.035em] sm:text-4xl">
                    三層資料，各有清楚用途
                  </h2>
                </div>
              </div>

              <div className="mt-8 divide-y divide-[#d7cebd] border-y border-[#d7cebd]">
                <article className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr]">
                  <h3 className="font-semibold">Cloudflare</h3>
                  <p className="text-sm leading-7 text-[#5e5b53]">
                    負責網站傳送與安全，並提供彙總訪問量。它作為網絡基礎設施仍可能處理請求層級技術資料；本頁開關不能阻止該層處理。
                  </p>
                </article>
                <article className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr]">
                  <h3 className="font-semibold">Vercel</h3>
                  <p className="text-sm leading-7 text-[#5e5b53]">
                    提供匿名頁面統計。送出前只保留網址的網域與路徑，查詢參數和頁面片段會被移除，避免把練習選擇或連結參數帶進統計。
                  </p>
                </article>
                <article className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr]">
                  <h3 className="font-semibold">本站 + Supabase</h3>
                  <p className="text-sm leading-7 text-[#5e5b53]">
                    記錄網站工作階段、開始課程、開始或完成錄音、逐字稿及 AI 回饋成功或失敗等功能事件。訪客只使用隨機的 30 分鐘匿名工作階段，不會與登入帳戶連接；原始事件滿 90 日後每日刪除。
                  </p>
                </article>
              </div>

              <div className="mt-8 grid gap-6 border border-[#b9ae9b] bg-[#faf7ef] p-6 sm:grid-cols-[auto_1fr] sm:p-8">
                <EyeOff aria-hidden="true" className="h-7 w-7 text-[#48634c]" />
                <div>
                  <h3 className="font-serif text-2xl tracking-[-0.025em]">第一方功能埋點永不寫入</h3>
                  <ul className="mt-5 grid gap-x-8 gap-y-3 text-sm leading-6 text-[#5e5b53] sm:grid-cols-2">
                    {noContentItems.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span aria-hidden="true" className="mt-[0.7rem] h-px w-4 shrink-0 bg-[#ad3f29]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="section-02" aria-labelledby="section-02-title" className="scroll-mt-24">
              <div className="flex items-start gap-5 border-b border-[#cfc5b3] pb-5">
                <span className="font-mono text-xs text-[#ad3f29]">02</span>
                <div>
                  <p className="eyebrow text-[#665f55]">Speaking data</p>
                  <h2 id="section-02-title" className="mt-2 font-serif text-3xl tracking-[-0.035em] sm:text-4xl">
                    只有你主動選擇，錄音才會離開瀏覽器
                  </h2>
                </div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <article className="border-l-2 border-[#48634c] py-2 pl-5">
                  <h3 className="font-semibold">一般練習</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5e5b53]">
                    錄音預設只留在目前瀏覽器供你回聽，不會因為分析埋點而上傳。訪客學習進度保存在瀏覽器本機。
                  </p>
                </article>
                <article className="border-l-2 border-[#48634c] py-2 pl-5">
                  <h3 className="font-semibold">登入後私人儲存</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5e5b53]">
                    只有登入並勾選儲存，錄音才上傳到 Supabase 私人儲存空間；學習進度、逐字稿與回饋會存入你的帳戶記錄，並受用戶層級權限限制。
                  </p>
                </article>
                <article className="border-l-2 border-[#ad3f29] py-2 pl-5 sm:col-span-2">
                  <h3 className="font-semibold">火山引擎逐字稿與 AI 回饋</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5e5b53]">
                    當你主動按下「整理成 AI 逐字稿」，網站會把該次錄音轉成 WAV，經本站伺服器傳送到火山引擎作語音識別；逐字稿可再傳給 AI 模型產生學習回饋。這些內容屬於你主動請求的學習處理，不會複製到分析事件表。
                  </p>
                </article>
              </div>

              <p className="mt-7 flex gap-3 text-xs leading-6 text-[#665f55]">
                <LockKeyhole aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
                第三方基礎設施與 AI 供應商仍會按其服務條款處理完成服務所需的技術資料；本站不會把供應商日誌說成我們可逐項控制或刪除的資料。
              </p>
            </section>

            <section id="section-03" aria-labelledby="section-03-title" className="scroll-mt-24">
              <div className="flex items-start gap-5 border-b border-[#cfc5b3] pb-5">
                <span className="font-mono text-xs text-[#ad3f29]">03</span>
                <div>
                  <p className="eyebrow text-[#665f55]">Retention & control</p>
                  <h2 id="section-03-title" className="mt-2 font-serif text-3xl tracking-[-0.035em] sm:text-4xl">
                    可以停止未來收集，但不假裝能扭轉過去
                  </h2>
                </div>
              </div>

              <div className="mt-8 space-y-6 text-sm leading-7 text-[#5e5b53]">
                <p>
                  第一方原始功能事件滿 90 日後由每日清理工作刪除；不含個人識別資料的彙總數字可保留更久，用來比較功能是否改善。Vercel 與 Cloudflare 的保留期由各自服務設定控制。
                </p>
                <p>
                  上方開關會停止這個瀏覽器未來送出的 Vercel 頁面事件與本站功能事件，並嘗試清除 30 分鐘匿名工作階段 Cookie。瀏覽器的 Do Not Track 設定同樣會自動暫停這些可控分析。選擇只適用於這個瀏覽器；清除瀏覽器資料或更換裝置後，需要重新設定。
                </p>
                <p>
                  過去的匿名事件沒有電郵或用戶 ID，因此我們無法可靠找出「屬於某個人」的單項事件作選擇性刪除；已經形成的彙總統計也無法還原。Cloudflare 的安全與請求處理不受這個頁面開關控制。
                </p>
              </div>

              <div className="mt-8 border-l-4 border-[#ad3f29] bg-[#eee5d6] p-5 sm:p-6">
                <div className="flex gap-3">
                  <Database aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#ad3f29]" />
                  <div>
                    <h3 className="font-semibold">帳戶資料刪除的現階段限制</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5e5b53]">
                      分析開關不會刪除登入帳戶內的學習記錄、逐字稿或私人錄音。網站目前沒有站內一鍵刪除帳戶，也未公布專用私隱電郵；如需刪除，請透過你取得網站邀請或支援的原聯絡渠道聯絡營運者，並不要在公開渠道張貼錄音、逐字稿或登入資料。
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-sm leading-7 text-[#5e5b53]">
                想先繼續學習？返回
                <Link href="/learn" className="focus-ring mx-1 font-semibold text-[#172019] underline decoration-[#ad3f29] underline-offset-4">
                  學習路徑
                </Link>
                ，或直接開啟
                <Link href="/papers" className="focus-ring ml-1 font-semibold text-[#172019] underline decoration-[#ad3f29] underline-offset-4">
                  真題庫
                </Link>
                。
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
