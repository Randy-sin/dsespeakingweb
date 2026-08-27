"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, LogOut, Menu, Mic2, Route, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getNextLesson } from "@/lib/learning/content";
import { useLearnerProfile, useLearningProgress } from "@/lib/learning/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/learn", label: "學習路徑", icon: Route },
  { href: "/learn/group-discussion", label: "小組討論", icon: Mic2 },
  { href: "/learn/individual-response", label: "個人回應", icon: UserRound },
  { href: "/papers", label: "真題庫", icon: BookOpen },
  { href: "/progress", label: "進度", icon: ChartNoAxesColumnIncreasing },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const learnerProfile = useLearnerProfile();
  const progress = useLearningProgress();
  const supabase = useMemo(() => createClient(), []);
  const nextLesson = getNextLesson(progress.completedLessons);
  const practiceHref = learnerProfile?.completedOnboarding && nextLesson
    ? `/learn/${nextLesson.mode}/${nextLesson.slug}`
    : "/practice/individual-response";
  const practiceLabel = learnerProfile?.completedOnboarding && nextLesson ? "繼續下一課" : "今日開口練習";

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("登出失敗，請再試一次");
      return;
    }
    toast.success("已登出");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#d7cebd]/80 bg-[#f3efe4]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center px-4 sm:px-7 lg:px-10">
        <Link href="/" className="focus-ring group flex shrink-0 items-center gap-3 rounded-sm">
          <span className="grid h-8 w-8 place-items-center border border-[#172019] bg-[#172019] font-mono text-[11px] font-semibold text-[#f3efe4] transition-transform group-hover:-rotate-3">
            P4
          </span>
          <span className="font-serif text-[18px] font-semibold tracking-[-0.03em]">DSE Speaking</span>
        </Link>

        <nav className="ml-10 hidden items-center gap-1 lg:flex" aria-label="主要導航">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  active ? "bg-[#172019] text-[#faf7ef]" : "text-[#5e5b53] hover:bg-[#e8e0cf] hover:text-[#172019]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild className="hidden h-10 rounded-full bg-[#c84b31] px-5 text-[13px] text-white hover:bg-[#aa3d27] sm:inline-flex">
            <Link href={practiceHref}>{practiceLabel}</Link>
          </Button>

          {!loading && !user ? (
            <Button asChild variant="ghost" className="hidden h-10 rounded-full px-4 text-[13px] text-[#5e5b53] sm:inline-flex">
              <Link href="/login">登入</Link>
            </Button>
          ) : null}

          {!loading && user ? (
            <details className="group relative hidden sm:block">
              <summary className="focus-ring flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-[#c9bfad] bg-[#faf7ef] px-3 text-[13px] [&::-webkit-details-marker]:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#48634c] text-[10px] font-semibold text-white">
                  {(profile?.display_name || user.email || "DS").slice(0, 2).toUpperCase()}
                </span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-12 w-52 border border-[#c9bfad] bg-[#faf7ef] p-2 shadow-xl">
                <p className="px-3 py-2 text-xs text-[#6d695f]">{user.email}</p>
                <Link href="/progress" className="block rounded-md px-3 py-2 text-sm hover:bg-[#e8e0cf]">
                  我的進度
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#8e3325] hover:bg-[#f0ded8]"
                >
                  <LogOut className="h-4 w-4" />
                  登出
                </button>
              </div>
            </details>
          ) : null}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full lg:hidden" aria-label="開啟導航">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined} className="w-[88vw] border-[#c9bfad] bg-[#f3efe4] p-0 sm:max-w-sm">
              <SheetTitle className="sr-only">主要導航</SheetTitle>
              <div className="flex h-full flex-col px-6 pb-8 pt-20">
                <p className="eyebrow text-[#8a8175]">Choose your next step</p>
                <nav className="mt-6 space-y-2">
                  {navItems.map((item, index) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                        className="flex items-center justify-between border-b border-[#d7cebd] py-4 font-serif text-[22px]"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[11px] text-[#8a8175]">0{index + 1}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <SheetClose asChild>
                  <Link
                    href={practiceHref}
                    className={cn(buttonVariants(), "mt-8 h-12 w-full rounded-full bg-[#c84b31] text-white hover:bg-[#aa3d27]")}
                  >
                    {practiceLabel}
                  </Link>
                </SheetClose>
                <div className="mt-auto border-t border-[#d7cebd] pt-5 text-sm">
                  {user ? (
                    <button type="button" onClick={handleSignOut} className="flex items-center gap-2 text-[#6d695f]">
                      <LogOut className="h-4 w-4" /> 登出
                    </button>
                  ) : (
                    <Link href="/login" className="text-[#172019] underline underline-offset-4">登入並同步進度</Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
