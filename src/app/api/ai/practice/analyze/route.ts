import { after, NextRequest, NextResponse } from "next/server";
import { bucketLatency, classifyAnalyticsOutcome, type ProductEventErrorCode } from "@/lib/analytics/events";
import { recordServerProductEvent } from "@/lib/analytics/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { normaliseLearningText } from "@/lib/ai/learning-prompts";
import { buildAssessmentPrompt, parsePracticeAssessment } from "@/lib/ai/practice-assessment";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginJsonRequest } from "@/lib/ai/require-user";
import { saveAssessment } from "@/lib/learning/practice-persistence";
import { parseOptionalUuid } from "@/lib/ids";

export const runtime = "nodejs";

function classifyAnalysisError(status: number): ProductEventErrorCode {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate-limited";
  if ([400, 413, 415].includes(status)) return "invalid-input";
  if (status >= 500) return "analysis-failed";
  return "unknown";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let analyticsMode: "group-discussion" | "individual-response" | undefined;
  let analyticsContentId: string | undefined;
  try {
    requireSameOriginJsonRequest(request);
    const { user, supabase } = await requireAiUser();
    const body = (await request.json()) as Record<string, unknown>;
    const mode = body.mode === "group-discussion" ? "group-discussion" : "individual-response";
    analyticsMode = mode;
    const task = normaliseLearningText(body.task, "task", 1600);
    const transcript = normaliseLearningText(body.transcript, "transcript", 5000);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const paperId = parseOptionalUuid(body.paperId, "paperId");
    analyticsContentId = paperId ?? undefined;
    await consumeAiRateLimit(supabase, "assessment");
    const result = await probeDoubaoRealtime({ text: buildAssessmentPrompt(mode, task, transcript), model: "O", timeoutMs: 25_000, includeTtsPcmS16le: false });
    const assessment = parsePracticeAssessment(result.chatText, mode);
    const savedSessionId = await saveAssessment({ supabase, userId: user.id, mode, task, transcript, sessionId, paperId }, assessment);
    after(() => recordServerProductEvent(request, {
      name: "analysis_completed",
      surface: "practice",
      context: "feedback",
      mode,
      outcome: classifyAnalyticsOutcome(200),
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: "authenticated",
      contentId: analyticsContentId,
    }));
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
    after(() => recordServerProductEvent(request, {
      name: "analysis_failed",
      surface: "practice",
      context: "feedback",
      mode: analyticsMode,
      outcome: classifyAnalyticsOutcome(status),
      errorCode: classifyAnalysisError(status),
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: status === 401 ? "anonymous" : undefined,
      contentId: analyticsContentId,
    }));
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
