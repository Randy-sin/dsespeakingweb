import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { parseRealtimeCallInput } from "@/lib/ai/realtime-api";

export const runtime = "nodejs";

async function assertAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = parseRealtimeCallInput(body);
    await assertAuthenticated();

    const result = await probeDoubaoRealtime({
      text: input.text,
      model: input.model,
      inputMode: input.inputMode,
      speaker: input.speaker,
      timeoutMs: input.timeoutMs,
    });

    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      chatText: result.chatText,
      latencyMs: result.latencyMs,
      totalAudioBytes: result.totalAudioBytes,
      eventTimeline: result.eventTimeline,
      audioChunksBase64: input.includeAudioChunks ? result.audioChunksBase64 : undefined,
      audioChunkCount: result.audioChunksBase64.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown realtime probe error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("required") || message.includes("too long")
            ? 400
            : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
