import { after, NextResponse } from "next/server";
import { bucketLatency } from "@/lib/analytics/events";
import { recordServerProductEvent } from "@/lib/analytics/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  // Handle PKCE flow (OAuth providers like Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      after(() => recordServerProductEvent(request, {
        name: "auth_completed",
        surface: "auth",
        context: "oauth-callback",
        outcome: "success",
        latencyBucket: bucketLatency(Date.now() - startedAt),
        authState: "authenticated",
      }));
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle email confirmation / password recovery / magic link
  // These arrive with token_hash + type after Supabase verifies the token
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "magiclink" | "email",
    });
    if (!error) {
      after(() => recordServerProductEvent(request, {
        name: "auth_completed",
        surface: "auth",
        context: type === "signup" ? "register" : "login",
        outcome: "success",
        latencyBucket: bucketLatency(Date.now() - startedAt),
        authState: "authenticated",
      }));
      // After password recovery, redirect to a password reset page if you have one,
      // otherwise just go to the default next page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/learn`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with error
  after(() => recordServerProductEvent(request, {
    name: "auth_failed",
    surface: "auth",
    context: code || searchParams.has("error") ? "oauth-callback" : "login",
    outcome: "failure",
    errorCode: "auth-failed",
    latencyBucket: bucketLatency(Date.now() - startedAt),
    authState: "anonymous",
  }));
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_failed");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
