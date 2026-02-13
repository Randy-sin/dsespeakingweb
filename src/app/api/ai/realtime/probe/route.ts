import { NextRequest, NextResponse } from "next/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";

export const runtime = "nodejs";

interface ProbeBody {
  text?: string;
  model?: "O" | "SC";
  speaker?: string;
  timeoutMs?: number;
  includeAudioChunks?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProbeBody;
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = await probeDoubaoRealtime({
      text,
      model: body.model === "SC" ? "SC" : "O",
      speaker: body.speaker?.trim() || undefined,
      timeoutMs: body.timeoutMs && body.timeoutMs > 0 ? body.timeoutMs : 15_000,
    });

    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      chatText: result.chatText,
      latencyMs: result.latencyMs,
      totalAudioBytes: result.totalAudioBytes,
      eventTimeline: result.eventTimeline,
      audioChunksBase64: body.includeAudioChunks ? result.audioChunksBase64 : undefined,
      audioChunkCount: result.audioChunksBase64.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown realtime probe error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
