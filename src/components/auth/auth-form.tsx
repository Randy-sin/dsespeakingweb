"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleOAuth = async (provider: Provider) => {
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split("@")[0],
            },
          },
        });
        if (error) throw error;
        toast.success("註冊成功");
        router.push("/rooms");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("登入成功");
        router.push("/rooms");
      }
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "操作失敗，請重試";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-serif text-[18px] font-semibold text-neutral-900 tracking-tight"
          >
            DSE Speaking
          </Link>
        </div>

        <h1 className="font-serif text-[24px] font-semibold text-neutral-900 text-center mb-2 tracking-tight">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-[14px] text-neutral-400 text-center mb-8">
          {mode === "login"
            ? "登入你的帳號繼續練習"
            : "註冊帳號開始 DSE Speaking 練習"}
        </p>

        {/* OAuth Buttons */}
        <div className="space-y-2.5 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 text-[14px] border-neutral-200 hover:bg-neutral-50 font-normal"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[12px] text-neutral-400">
              or
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="text-[13px] text-neutral-500"
              >
                暱稱
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="你的名字"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] text-neutral-500">
              電郵
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] text-neutral-500">
              密碼
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-10 text-[14px] border-neutral-200 focus-visible:ring-neutral-400"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 mt-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-lg"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "登入" : "註冊"}
          </Button>
        </form>

        <p className="text-[13px] text-neutral-400 text-center mt-6">
          {mode === "login" ? (
            <>
              還沒有帳號？{" "}
              <Link
                href="/register"
                className="text-neutral-900 hover:underline"
              >
                註冊
              </Link>
            </>
          ) : (
            <>
              已有帳號？{" "}
              <Link href="/login" className="text-neutral-900 hover:underline">
                登入
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
