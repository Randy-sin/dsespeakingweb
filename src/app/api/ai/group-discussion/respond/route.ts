import { after, NextRequest, NextResponse } from "next/server";
import { bucketLatency, classifyAnalyticsOutcome, type ProductEventErrorCode } from "@/lib/analytics/events";
import { recordServerProductEvent } from "@/lib/analytics/server";
import { buildBasicDiscussionDrill } from "@/lib/ai/basic-coaching";
import { DoubaoRealtimeEntitlementError, probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { buildGroupDiscussionPrompt, normaliseLearningText, parseGroupDiscussionResponse } from "@/lib/ai/learning-prompts";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginJsonRequest } from "@/lib/ai/require-user";
import { saveDiscussionTurns } from "@/lib/learning/practice-persistence";
import { parseOptionalUuid } from "@/lib/ids";

export const runtime = "nodejs";

function classifyDiscussionError(status: number): ProductEventErrorCode {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate-limited";
  if ([400, 413, 415].includes(status)) return "invalid-input";
  if (status >= 500) return "discussion-failed";
  return "unknown";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let analyticsRound: number | undefined;
  let analyticsContentId: string | undefined;
  try {
    requireSameOriginJsonRequest(request);
    const { user, supabase } = await requireAiUser();
    const body = (await request.json()) as Record<string, unknown>;
    const context = normaliseLearningText(body.context, "context", 1600);
    const learnerTurn = normaliseLearningText(body.learnerTurn, "learnerTurn", 1200);
    const previousTurns = typeof body.previousTurns === "string" && body.previousTurns.trim()
      ? normaliseLearningText(body.previousTurns, "previousTurns", 2400)
      : "No earlier turns.";
    const requestedRound = typeof body.round === "number" ? Math.floor(body.round) : 1;
    if (requestedRound < 1 || requestedRound > 3) throw new Error("round is invalid");
    analyticsRound = requestedRound;
    const partnerRole = requestedRound % 2 === 1 ? "Student A" : "Student B";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const paperId = parseOptionalUuid(body.paperId, "paperId");
    analyticsContentId = paperId ?? undefined;
    await consumeAiRateLimit(supabase, "teammate");
    let result;
    try {
      result = await probeDoubaoRealtime({ text: buildGroupDiscussionPrompt(context, learnerTurn, { partnerRole, previousTurns }), model: "O", timeoutMs: 20_000 });
    } catch (providerError) {
      if (!(providerError instanceof DoubaoRealtimeEntitlementError)) throw providerError;

      const basicCoaching = buildBasicDiscussionDrill(learnerTurn);
      after(async () => {
        await Promise.all([
          recordServerProductEvent(request, {
            name: "flow_error",
            surface: "practice",
            context: "practice-session",
            mode: "group-discussion",
            outcome: "failure",
            errorCode: "discussion-failed",
            latencyBucket: bucketLatency(Date.now() - startedAt),
            authState: "authenticated",
            contentId: analyticsContentId,
            round: requestedRound,
          }),
          recordServerProductEvent(request, {
            name: "basic_coaching_delivered",
            surface: "practice",
            context: "practice-session",
            mode: "group-discussion",
            outcome: "success",
            authState: "authenticated",
            contentId: analyticsContentId,
            round: requestedRound,
          }),
        ]);
      });
      return NextResponse.json({
        ok: true,
        resultMode: "basic_coaching",
        basicCoaching,
        round: requestedRound,
        persisted: false,
        evidenceSource: "local_rules",
      });
    }
    const response = parseGroupDiscussionResponse(result.chatText);
    const savedSessionId = await saveDiscussionTurns({ supabase, userId: user.id, mode: "group-discussion", task: context, transcript: learnerTurn, sessionId, paperId }, response);
    after(() => recordServerProductEvent(request, {
      name: "discussion_turn_completed",
      surface: "practice",
      context: "practice-session",
      mode: "group-discussion",
      outcome: classifyAnalyticsOutcome(200),
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: "authenticated",
      contentId: analyticsContentId,
      round: requestedRound,
    }));
    return NextResponse.json({ ok: true, resultMode: "ai_teammate", response, partnerRole, round: requestedRound, sessionId: savedSessionId, persisted: true, latencyMs: result.latencyMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI response failed";
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
      name: "flow_error",
      surface: "practice",
      context: "practice-session",
      mode: "group-discussion",
      outcome: classifyAnalyticsOutcome(status),
      errorCode: classifyDiscussionError(status),
      latencyBucket: bucketLatency(Date.now() - startedAt),
      authState: status === 401 ? "anonymous" : undefined,
      contentId: analyticsContentId,
      round: analyticsRound,
    }));
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
