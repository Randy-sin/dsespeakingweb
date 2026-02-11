"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("已退出登录");
    router.push("/");
    router.refresh();
  };

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/90 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-serif text-[17px] font-semibold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            DSE Speaking
          </Link>

          <div className="flex items-center gap-1">
            {loading ? (
              <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link href="/rooms">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[13px] text-neutral-500 hover:text-neutral-900 font-normal"
                  >
                    Rooms
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-neutral-900 text-white text-[11px] font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-neutral-900">
                        {profile?.display_name || "用户"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-[13px]">
                      <User className="mr-2 h-3.5 w-3.5" />
                      个人资料
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-[13px] text-neutral-500"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[13px] text-neutral-500 hover:text-neutral-900 font-normal"
                  >
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="text-[13px] h-8 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-4"
                  >
                    注册
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
