import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - only actions that require auth
  const protectedPaths = ["/rooms/create"];
  const isProtectedPath =
    protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    ) ||
    // /rooms/[id] (waiting room & session) require auth, but /rooms itself is public
    /^\/rooms\/[^/]+/.test(request.nextUrl.pathname);

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user visits auth pages, redirect to rooms
  const authPaths = ["/login", "/register"];
  const isAuthPath = authPaths.some(
    (path) => request.nextUrl.pathname === path
  );

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/rooms";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
