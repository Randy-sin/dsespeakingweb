import { NextRequest, NextResponse } from "next/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { buildGroupDiscussionPrompt, normaliseLearningText } from "@/lib/ai/learning-prompts";
import { requireAiUser, requireSameOriginJsonRequest } from "@/lib/ai/require-user";
import { createClient } from "@/lib/supabase/server";
import { saveDiscussionTurns } from "@/lib/learning/practice-persistence";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireSameOriginJsonRequest(request);
    const user = await requireAiUser();
    const supabase = await createClient();
    const body = (await request.json()) as Record<string, unknown>;
    const context = normaliseLearningText(body.context, "context", 1600);
    const learnerTurn = normaliseLearningText(body.learnerTurn, "learnerTurn", 1200);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const result = await probeDoubaoRealtime({ text: buildGroupDiscussionPrompt(context, learnerTurn), model: "O", timeoutMs: 20_000 });
    const savedSessionId = await saveDiscussionTurns({ supabase, userId: user.id, mode: "group-discussion", task: context, transcript: learnerTurn, sessionId }, result.chatText);
    return NextResponse.json({ ok: true, response: result.chatText, sessionId: savedSessionId, persisted: true, latencyMs: result.latencyMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI response failed";
    const status = message === "Unauthorized"
      ? 401
      : message === "Forbidden request origin"
        ? 403
        : message === "Unsupported content type"
          ? 415
          : message === "Request body is too large"
            ? 413
            : message.includes("required") || message.includes("too long")
              ? 400
              : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
