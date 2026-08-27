import { createClient } from "@/lib/supabase/server";

const MAX_AI_REQUEST_BYTES = 16_000;

export type AiRateLimitAction = "assessment" | "teammate" | "transcription";

type RateLimitRow = {
  allowed: boolean;
  retry_after_seconds: number;
  remaining: number;
};

export class AiRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many AI requests");
    this.name = "AiRateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

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
  if (user.is_anonymous) throw new Error("Unauthorized");
  return { user, supabase };
}

function isRateLimitRow(value: unknown): value is RateLimitRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.allowed === "boolean"
    && typeof row.retry_after_seconds === "number"
    && typeof row.remaining === "number";
}

export async function consumeAiRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: AiRateLimitAction,
) {
  const { data, error } = await supabase.rpc("consume_ai_rate_limit", { p_action: action });
  if (error) throw new Error("AI rate-limit service unavailable");
  const row = Array.isArray(data) ? data[0] : data;
  if (!isRateLimitRow(row)) throw new Error("AI rate-limit service returned an invalid response");
  if (!row.allowed) throw new AiRateLimitError(row.retry_after_seconds);
  return { remaining: row.remaining };
}
