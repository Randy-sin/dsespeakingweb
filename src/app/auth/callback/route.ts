import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/rooms";

  const supabase = await createClient();

  // Handle PKCE flow (OAuth providers like Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
      // After password recovery, redirect to a password reset page if you have one,
      // otherwise just go to the default next page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/rooms`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
