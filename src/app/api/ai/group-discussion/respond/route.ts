import { NextRequest, NextResponse } from "next/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { buildGroupDiscussionPrompt, normaliseLearningText, parseGroupDiscussionResponse } from "@/lib/ai/learning-prompts";
import { AiRateLimitError, consumeAiRateLimit, requireAiUser, requireSameOriginJsonRequest } from "@/lib/ai/require-user";
import { saveDiscussionTurns } from "@/lib/learning/practice-persistence";
import { parseOptionalUuid } from "@/lib/ids";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
    const partnerRole = requestedRound % 2 === 1 ? "Student A" : "Student B";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const paperId = parseOptionalUuid(body.paperId, "paperId");
    await consumeAiRateLimit(supabase, "teammate");
    const result = await probeDoubaoRealtime({ text: buildGroupDiscussionPrompt(context, learnerTurn, { partnerRole, previousTurns }), model: "O", timeoutMs: 20_000 });
    const response = parseGroupDiscussionResponse(result.chatText);
    const savedSessionId = await saveDiscussionTurns({ supabase, userId: user.id, mode: "group-discussion", task: context, transcript: learnerTurn, sessionId, paperId }, response);
    return NextResponse.json({ ok: true, response, partnerRole, round: requestedRound, sessionId: savedSessionId, persisted: true, latencyMs: result.latencyMs });
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
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}
