import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { probeDoubaoRealtime } from "@/lib/ai/doubao-realtime";
import { parseRealtimeCallInput } from "@/lib/ai/realtime-api";

export const runtime = "nodejs";

async function assertRoomMember(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: member, error } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single();

  if (error || !member) {
    throw new Error("Not a member of this room");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = parseRealtimeCallInput(body, { requireRoomId: true });
    await assertRoomMember(input.roomId!);

    const result = await probeDoubaoRealtime({
      text: input.text,
      model: input.model,
      inputMode: input.inputMode,
      speaker: input.speaker,
      timeoutMs: input.timeoutMs,
    });

    return NextResponse.json({
      ok: true,
      chatText: result.chatText,
      latencyMs: result.latencyMs,
      audioChunkCount: result.audioChunksBase64.length,
      totalAudioBytes: result.totalAudioBytes,
      eventTimeline: result.eventTimeline,
      audioChunksBase64: input.includeAudioChunks ? result.audioChunksBase64 : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown realtime respond error";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Not a member of this room"
          ? 403
          : message.includes("required") || message.includes("too long")
            ? 400
            : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
