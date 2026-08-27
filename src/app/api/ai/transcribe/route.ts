import { NextRequest, NextResponse } from "next/server";
import { normaliseLearningText } from "@/lib/ai/learning-prompts";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginRequest } from "@/lib/ai/require-user";
import { transcribeWithVolcengine } from "@/lib/ai/volcengine-asr";
import { saveTranscript } from "@/lib/learning/practice-persistence";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(["audio/wav", "audio/x-wav", "audio/mpeg", "audio/ogg"]);

export async function POST(request: NextRequest) {
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
    const task = normaliseLearningText(form.get("task"), "task", 1600);
    const existingSessionId = typeof form.get("sessionId") === "string" ? String(form.get("sessionId")) : null;
    await consumeAiRateLimit(supabase, "transcription");
    const result = await transcribeWithVolcengine(Buffer.from(await audio.arrayBuffer()));
    const sessionId = await saveTranscript({ supabase, userId: user.id, mode, task, transcript: result.transcript, sessionId: existingSessionId });
    return NextResponse.json({ ok: true, transcript: result.transcript, durationMs: result.durationMs, sessionId, persisted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription unavailable";
    const status = error instanceof AiRateLimitError ? 429
      : message === "Unauthorized" ? 401
      : message === "Forbidden request origin" ? 403
        : message === "Unsupported content type" || message === "Unsupported audio format" ? 415
          : message === "Request body is too large" ? 413
            : message.includes("required") ? 400
              : message.includes("not enabled") ? 503
                : 502;
    const headers = error instanceof AiRateLimitError
      ? { "Retry-After": String(error.retryAfterSeconds) }
      : undefined;
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
