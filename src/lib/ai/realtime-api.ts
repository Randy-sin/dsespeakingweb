import type { DoubaoInputMode, DoubaoModel } from "@/lib/ai/doubao-realtime";

export interface RealtimeCallInput {
  text: string;
  roomId?: string;
  model: DoubaoModel;
  inputMode: DoubaoInputMode;
  speaker?: string;
  timeoutMs: number;
  includeAudioChunks: boolean;
}

const MAX_TEXT_LENGTH = 1200;

export function parseRealtimeCallInput(
  body: Record<string, unknown>,
  options?: { requireRoomId?: boolean }
): RealtimeCallInput {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    throw new Error("text is required");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`text is too long, max ${MAX_TEXT_LENGTH} characters`);
  }

  const model = body.model === "SC" ? "SC" : "O";
  const inputMode = body.inputMode === "audio_file" ? "audio_file" : "text";
  const timeoutMsRaw = typeof body.timeoutMs === "number" ? body.timeoutMs : 15_000;
  const timeoutMs = Math.max(5_000, Math.min(60_000, Math.floor(timeoutMsRaw)));
  const speaker = typeof body.speaker === "string" && body.speaker.trim() ? body.speaker.trim() : undefined;
  const includeAudioChunks = Boolean(body.includeAudioChunks);

  const roomId =
    typeof body.roomId === "string" && body.roomId.trim().length > 0
      ? body.roomId.trim()
      : undefined;
  if (options?.requireRoomId && !roomId) {
    throw new Error("roomId is required");
  }

  return {
    text,
    roomId,
    model,
    inputMode,
    speaker,
    timeoutMs,
    includeAudioChunks,
  };
}
