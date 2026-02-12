"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2, RotateCw } from "lucide-react";
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

  // Email verification state
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  const handleResendVerification = useCallback(async () => {
    if (resending || resendCooldown > 0 || !email) return;
    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("驗證郵件已重新發送");
      setResendCooldown(60);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "發送失敗，請稍後再試";
      toast.error(message);
    } finally {
      setResending(false);
    }
  }, [email, resending, resendCooldown, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split("@")[0],
            },
          },
        });
        if (error) throw error;

        // Supabase returns a user with identities = [] if the email is already registered
        // but unconfirmed. Check if we need email confirmation.
        const needsConfirmation =
          data.user && !data.session;

        if (needsConfirmation) {
          setEmailSent(true);
          setResendCooldown(60);
          return; // Don't redirect — show verification screen
        }

        // If session exists, user is auto-confirmed (e.g. email confirmation disabled)
        toast.success("註冊成功");
        router.push("/rooms");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Special handling: if user tries to login but hasn't confirmed email
          if (
            error.message.toLowerCase().includes("email not confirmed") ||
            error.message.toLowerCase().includes("not confirmed")
          ) {
            setEmailSent(true);
            setResendCooldown(0);
            toast.error("請先驗證你的電郵地址");
            return;
          }
          throw error;
        }

        toast.success("登入成功");
        router.push("/rooms");
        router.refresh();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "操作失敗，請重試";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Email Verification Confirmation Screen ────────────────────────
  if (emailSent) {
    const emailDomain = email.split("@")[1] || "";
    const mailProviderUrl = getMailProviderUrl(emailDomain);

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-5">
        <div className="w-full max-w-sm text-center">
          <div className="text-center mb-10">
            <Link
              href="/"
              className="font-serif text-[18px] font-semibold text-neutral-900 tracking-tight"
            >
              DSE Speaking
            </Link>
          </div>

          {/* Mail icon with animated ring */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-50 animate-ping opacity-25" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <h1 className="font-serif text-[24px] font-semibold text-neutral-900 tracking-tight mb-2">
            檢查你的電子郵件
          </h1>
          <p className="text-[14px] text-neutral-500 leading-relaxed mb-2">
            我們已發送一封驗證郵件到
          </p>
          <p className="text-[15px] font-medium text-neutral-900 mb-6 break-all">
            {email}
          </p>

          {/* Instructions */}
          <div className="bg-neutral-50 rounded-xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                <span className="text-[12px] font-semibold text-emerald-700">1</span>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                打開你的郵箱，找到來自 <span className="font-medium text-neutral-900">DSE Speaking</span> 的郵件
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                <span className="text-[12px] font-semibold text-emerald-700">2</span>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                點擊郵件中的 <span className="font-medium text-neutral-900">確認連結</span> 完成驗證
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                <span className="text-[12px] font-semibold text-emerald-700">3</span>
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed">
                驗證完成後回來<Link href="/login" className="font-medium text-neutral-900 underline underline-offset-2">登入</Link>即可
              </p>
            </div>
          </div>

          {/* Spam notice */}
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
            <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-[12px] text-amber-700">
              找不到郵件？請檢查<span className="font-semibold">垃圾郵件</span>或<span className="font-semibold">促銷</span>資料夾
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            {mailProviderUrl && (
              <a
                href={mailProviderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  type="button"
                  className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 text-white text-[14px] rounded-lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  打開 {getMailProviderName(emailDomain)}
                </Button>
              </a>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-[14px] border-neutral-200 hover:bg-neutral-50 rounded-lg"
              disabled={resending || resendCooldown > 0}
              onClick={handleResendVerification}
            >
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="mr-2 h-4 w-4" />
              )}
              {resendCooldown > 0
                ? `重新發送 (${resendCooldown}s)`
                : "重新發送驗證郵件"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEmailSent(false);
              setEmail("");
              setPassword("");
            }}
            className="inline-flex items-center justify-center text-[13px] text-neutral-400 hover:text-neutral-900 mt-6 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            使用其他方式{mode === "register" ? "註冊" : "登入"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Normal Auth Form ──────────────────────────────────────────────
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

// ─── Helpers: map email domain to webmail URL ───────────────────────

function getMailProviderUrl(domain: string): string | null {
  const d = domain.toLowerCase();
  if (d === "gmail.com" || d === "googlemail.com") return "https://mail.google.com";
  if (d === "outlook.com" || d === "hotmail.com" || d === "live.com" || d === "msn.com")
    return "https://outlook.live.com";
  if (d === "yahoo.com" || d === "yahoo.com.hk") return "https://mail.yahoo.com";
  if (d === "icloud.com" || d === "me.com" || d === "mac.com")
    return "https://www.icloud.com/mail";
  if (d === "qq.com") return "https://mail.qq.com";
  if (d === "163.com") return "https://mail.163.com";
  if (d === "126.com") return "https://mail.126.com";
  if (d === "protonmail.com" || d === "proton.me") return "https://mail.proton.me";
  return null;
}

function getMailProviderName(domain: string): string {
  const d = domain.toLowerCase();
  if (d === "gmail.com" || d === "googlemail.com") return "Gmail";
  if (d === "outlook.com" || d === "hotmail.com" || d === "live.com" || d === "msn.com")
    return "Outlook";
  if (d === "yahoo.com" || d === "yahoo.com.hk") return "Yahoo Mail";
  if (d === "icloud.com" || d === "me.com" || d === "mac.com") return "iCloud Mail";
  if (d === "qq.com") return "QQ 郵箱";
  if (d === "163.com") return "163 郵箱";
  if (d === "126.com") return "126 郵箱";
  if (d === "protonmail.com" || d === "proton.me") return "Proton Mail";
  return "郵箱";
}
