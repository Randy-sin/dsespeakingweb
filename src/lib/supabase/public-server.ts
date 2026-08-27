import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const publicFetch: typeof fetch = (input, init) => fetch(
  input,
  {
    ...init,
    cache: "force-cache",
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } },
);

export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { fetch: publicFetch },
    },
  );
}
