import { createClient } from "@/lib/supabase/server";

const MAX_AI_REQUEST_BYTES = 16_000;

export function requireSameOriginRequest(request: Request, maxBytes: number) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || origin !== requestOrigin || (fetchSite && fetchSite !== "same-origin")) {
    throw new Error("Forbidden request origin");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("Request body is too large");
  }
}

export function requireSameOriginJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("Unsupported content type");
  requireSameOriginRequest(request, MAX_AI_REQUEST_BYTES);
}

export async function requireAiUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
