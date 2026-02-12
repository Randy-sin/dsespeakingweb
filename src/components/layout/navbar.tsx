"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile, loading } = useUser();
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("nav.logout", "Sign out"));
    router.push("/");
    router.refresh();
  };

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-8">
            <Link
              href="/"
              className="font-serif text-[16px] sm:text-[17px] font-semibold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              DSE Speaking
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/rooms">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[13px] text-neutral-500 hover:text-neutral-900 font-normal min-h-11 px-4"
                >
                  {t("nav.rooms", "Rooms")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/rooms" className="sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 rounded-full text-neutral-500 hover:text-neutral-900"
                aria-label={t("nav.rooms", "Rooms")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </Link>
            <Select
              value={locale}
              onValueChange={(v) =>
                setLocale(v === "zh-Hant" ? "zh-Hant" : "en")
              }
            >
              <SelectTrigger
                className="min-h-11 w-[74px] sm:w-auto text-[12px] border-neutral-200 text-neutral-500"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="en">
                  <span className="sm:hidden">EN</span>
                  <span className="hidden sm:inline">
                    {t("nav.langEnglish", "English")}
                  </span>
                </SelectItem>
                <SelectItem value="zh-Hant">
                  <span className="sm:hidden">繁中</span>
                  <span className="hidden sm:inline">
                    {t("nav.langTraditionalChinese", "Traditional Chinese")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {loading ? (
              <div className="h-11 w-16 bg-neutral-100 animate-pulse rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative min-h-11 min-w-11 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-neutral-900 text-white text-[11px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-neutral-900">
                      {profile?.display_name || t("nav.user", "User")}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-[13px] rounded-lg mx-1">
                    <User className="mr-2 h-3.5 w-3.5" />
                    {t("nav.profile", "Profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-[13px] text-neutral-500 rounded-lg mx-1"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    {t("nav.logout", "Sign out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[13px] text-neutral-500 hover:text-neutral-900 font-normal min-h-11 px-4"
                  >
                    {t("nav.login", "Login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="text-[13px] min-h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-4 shadow-sm"
                  >
                    {t("nav.register", "Sign up")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
