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

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
        toast.success("注册成功");
        router.push("/rooms");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("登录成功");
        router.push("/rooms");
      }
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "操作失败，请重试";
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
            ? "登录你的账号继续练习"
            : "注册账号开始 DSE Speaking 练习"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="displayName"
                className="text-[13px] text-neutral-500"
              >
                昵称
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
              邮箱
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
              密码
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
            {mode === "login" ? "登录" : "注册"}
          </Button>
        </form>

        <p className="text-[13px] text-neutral-400 text-center mt-6">
          {mode === "login" ? (
            <>
              还没有账号？{" "}
              <Link
                href="/register"
                className="text-neutral-900 hover:underline"
              >
                注册
              </Link>
            </>
          ) : (
            <>
              已有账号？{" "}
              <Link href="/login" className="text-neutral-900 hover:underline">
                登录
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
