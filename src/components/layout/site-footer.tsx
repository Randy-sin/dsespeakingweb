import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#cfc5b3] bg-[#172019] text-[#f3efe4]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-10">
        <div>
          <p className="font-serif text-2xl">DSE Speaking</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#b8b5aa]">
            把口試技巧拆開學，再用真題練到可以自然說出來。AI 回饋只作學習參考，不代表 HKEAA 官方評分。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-[#d7d3c8] sm:grid-cols-3">
          <Link className="inline-flex min-h-11 items-center" href="/learn">學習路徑</Link>
          <Link className="inline-flex min-h-11 items-center" href="/papers">真題庫</Link>
          <Link className="inline-flex min-h-11 items-center" href="/progress">我的進度</Link>
          <Link className="inline-flex min-h-11 items-center" href="/learn/group-discussion">小組討論</Link>
          <Link className="inline-flex min-h-11 items-center" href="/learn/individual-response">個人回應</Link>
          <Link className="inline-flex min-h-11 items-center" href="/login">登入</Link>
        </div>
      </div>
    </footer>
  );
}
