import { NextRequest, NextResponse } from "next/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { normaliseLearningText } from "@/lib/ai/learning-prompts";
import { buildAssessmentPrompt, parsePracticeAssessment } from "@/lib/ai/practice-assessment";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginJsonRequest } from "@/lib/ai/require-user";
import { saveAssessment } from "@/lib/learning/practice-persistence";
import { parseOptionalUuid } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireSameOriginJsonRequest(request);
    const { user, supabase } = await requireAiUser();
    const body = (await request.json()) as Record<string, unknown>;
    const mode = body.mode === "group-discussion" ? "group-discussion" : "individual-response";
    const task = normaliseLearningText(body.task, "task", 1600);
    const transcript = normaliseLearningText(body.transcript, "transcript", 5000);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const paperId = parseOptionalUuid(body.paperId, "paperId");
    await consumeAiRateLimit(supabase, "assessment");
    const result = await probeDoubaoRealtime({ text: buildAssessmentPrompt(mode, task, transcript), model: "O", timeoutMs: 25_000, includeTtsPcmS16le: false });
    const assessment = parsePracticeAssessment(result.chatText, mode);
    const savedSessionId = await saveAssessment({ supabase, userId: user.id, mode, task, transcript, sessionId, paperId }, assessment);
    return NextResponse.json({ ok: true, assessment, sessionId: savedSessionId, persisted: true, evidenceSource: "learner_transcript", latencyMs: result.latencyMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    const status = error instanceof AiRateLimitError
      ? 429
      : message === "Unauthorized"
      ? 401
      : message === "Forbidden request origin"
        ? 403
        : message === "Unsupported content type"
          ? 415
          : message === "Request body is too large"
            ? 413
            : message.includes("required") || message.includes("too long") || message.includes("invalid")
              ? 400
              : 502;
    const headers = error instanceof AiRateLimitError
      ? { "Retry-After": String(error.retryAfterSeconds) }
      : undefined;
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
