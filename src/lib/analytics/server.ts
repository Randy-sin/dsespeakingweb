import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  createProductEventEnvelope,
  type ProductEvent,
  type ProductEventEnvelope,
} from "@/lib/analytics/events";
import {
  hasAnalyticsServerOptOut,
  hashAnalyticsSession,
  readAnalyticsSessionCookie,
} from "@/lib/analytics/session";

type AnalyticsServerConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  ingestToken: string;
};

export type ProductEventIngestResult = "accepted" | "misconfigured" | "rejected";

// Supabase is hosted in Seoul while some preview/dev runtimes are elsewhere;
// keep a bounded timeout without discarding normal cross-region writes.
const INGEST_TIMEOUT_MILLISECONDS = 6_000;

function getAnalyticsServerConfig(): AnalyticsServerConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ingestToken = process.env.ANALYTICS_INGEST_TOKEN;

  if (!supabaseUrl || !supabaseAnonKey || !ingestToken || ingestToken.length < 32) return null;

  try {
    const protocol = new URL(supabaseUrl).protocol;
    if (protocol !== "https:" && protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey, ingestToken };
}

export async function ingestProductEvent(
  event: ProductEventEnvelope,
  sessionId: string,
): Promise<ProductEventIngestResult> {
  const config = getAnalyticsServerConfig();
  if (!config) return "misconfigured";

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), INGEST_TIMEOUT_MILLISECONDS);

  try {
    const sessionHash = await hashAnalyticsSession(sessionId, config.ingestToken);
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          cache: "no-store",
          signal: abortController.signal,
        }),
      },
    });

    const { data, error } = await supabase.rpc("ingest_product_event", {
      p_ingest_token: config.ingestToken,
      p_event_id: event.id,
      p_session_hash: sessionHash,
      p_event_name: event.name,
      p_surface: event.surface ?? null,
      p_mode: event.mode ?? null,
      p_context: event.context ?? null,
      p_outcome: event.outcome ?? null,
      p_input_source: event.inputSource ?? null,
      p_error_code: event.errorCode ?? null,
      p_duration_bucket: event.durationBucket ?? null,
      p_latency_bucket: event.latencyBucket ?? null,
      p_auth_state: event.authState ?? null,
      p_content_id: event.contentId ?? null,
      p_round: event.round ?? null,
      p_schema_version: event.schemaVersion,
    });

    return error || data !== true ? "rejected" : "accepted";
  } catch {
    return "rejected";
  } finally {
    clearTimeout(timeout);
  }
}

export async function recordServerProductEvent(request: Request, event: ProductEvent): Promise<boolean> {
  try {
    const doNotTrack = request.headers.get("dnt")?.trim().toLowerCase();
    if (doNotTrack === "1" || doNotTrack === "yes" || hasAnalyticsServerOptOut(request)) return false;
    const sessionId = readAnalyticsSessionCookie(request);
    if (!sessionId) return false;

    const envelope = createProductEventEnvelope(event, crypto.randomUUID());
    if (!envelope) return false;

    return (await ingestProductEvent(envelope, sessionId)) === "accepted";
  } catch {
    return false;
  }
}
