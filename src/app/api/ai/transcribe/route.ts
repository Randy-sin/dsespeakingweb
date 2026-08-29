import { after, NextRequest, NextResponse } from "next/server";
import { bucketLatency, classifyAnalyticsOutcome, type ProductEventErrorCode } from "@/lib/analytics/events";
import { recordServerProductEvent } from "@/lib/analytics/server";
import { normaliseLearningText } from "@/lib/ai/learning-prompts";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginRequest } from "@/lib/ai/require-user";
import { transcribeWithVolcengine } from "@/lib/ai/volcengine-asr";
import { saveTranscript } from "@/lib/learning/practice-persistence";
import { parseOptionalUuid } from "@/lib/ids";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg"]);

function classifyTranscriptionError(status: number): ProductEventErrorCode {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate-limited";
  if ([400, 413, 415].includes(status)) return "invalid-input";
  if (status >= 500) return "transcription-failed";
  return "unknown";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let analyticsMode: "group-discussion" | "individual-response" | undefined;
  let analyticsContentId: string | undefined;
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("multipart/form-data")) throw new Error("Unsupported content type");
    requireSameOriginRequest(request, MAX_AUDIO_BYTES + 200_000);
    const { user, supabase } = await requireAiUser();
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) throw new Error("audio is required");
    if (!ALLOWED_AUDIO_TYPES.has(audio.type.toLowerCase())) throw new Error("Unsupported audio format");
    if (audio.size <= 0 || audio.size > MAX_AUDIO_BYTES) throw new Error("Request body is too large");
    const mode = form.get("mode") === "group-discussion" ? "group-discussion" : "individual-response";
    analyticsMode = mode;
    const task = normaliseLearningText(form.get("task"), "task", 1600);
    const existingSessionId = typeof form.get("sessionId") === "string" ? String(form.get("sessionId")) : null;
    const paperId = parseOptionalUuid(form.get("paperId"), "paperId");
    analyticsContentId = paperId ?? undefined;
    await consumeAiRateLimit(supabase, "transcription");
    const result = await transcribeWithVolcengine(Buffer.from(await audio.arrayBuffer()));
    const sessionId = await saveTranscript({ supabase, userId: user.id, mode, task, transcript: result.transcript, sessionId: existingSessionId, paperId });
    after(() => recordServerProductEvent(request, {
      name: "transcription_completed",
      surface: "practice",
      context: "practice-session",
      mode,
      outcome: classifyAnalyticsOutcome(200),
      inputSource: "voice",
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: "authenticated",
      contentId: analyticsContentId,
    }));
    return NextResponse.json({ ok: true, transcript: result.transcript, durationMs: result.durationMs, sessionId, persisted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription unavailable";
    const status = error instanceof AiRateLimitError ? 429
      : message === "Unauthorized" ? 401
      : message === "Forbidden request origin" ? 403
        : message === "Unsupported content type" || message === "Unsupported audio format" ? 415
          : message === "Request body is too large" ? 413
            : message.includes("required") || message.includes("invalid") ? 400
              : message.includes("not enabled") ? 503
                : 502;
    const headers = error instanceof AiRateLimitError
      ? { "Retry-After": String(error.retryAfterSeconds) }
      : undefined;
    after(() => recordServerProductEvent(request, {
      name: "transcription_failed",
      surface: "practice",
      context: "practice-session",
      mode: analyticsMode,
      outcome: classifyAnalyticsOutcome(status),
      inputSource: "voice",
      errorCode: classifyTranscriptionError(status),
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: status === 401 ? "anonymous" : undefined,
      contentId: analyticsContentId,
    }));
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
