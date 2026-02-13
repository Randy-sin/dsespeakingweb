import { randomUUID } from "crypto";
import WebSocket from "ws";
import { getDoubaoRealtimeEnv } from "@/lib/ai/env";

type DoubaoModel = "O" | "SC";

interface RealtimeProbeParams {
  text: string;
  model?: DoubaoModel;
  speaker?: string;
  timeoutMs?: number;
}

interface TimelineItem {
  eventId?: number;
  eventName: string;
  at: number;
  payload?: unknown;
  audioBytes?: number;
}

export interface RealtimeProbeResult {
  sessionId: string;
  chatText: string;
  eventTimeline: TimelineItem[];
  audioChunksBase64: string[];
  totalAudioBytes: number;
  latencyMs: number;
}

interface ParsedFrame {
  messageType: number;
  flags: number;
  serialization: number;
  compression: number;
  eventId?: number;
  sessionId?: string;
  payload: Buffer;
}

const EVENT = {
  StartConnection: 1,
  FinishConnection: 2,
  StartSession: 100,
  FinishSession: 102,
  ChatTextQuery: 501,

  ConnectionStarted: 50,
  ConnectionFailed: 51,
  SessionStarted: 150,
  SessionFinished: 152,
  SessionFailed: 153,
  TTSEnded: 359,
  ChatResponse: 550,
} as const;

function eventName(eventId?: number): string {
  if (!eventId) return "Unknown";
  const entries = Object.entries(EVENT).find(([, value]) => value === eventId);
  return entries?.[0] ?? `Event${eventId}`;
}

function int32BE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n, 0);
  return b;
}

function buildJsonEventFrame(eventId: number, payload: unknown, sessionId?: string): Buffer {
  // Byte0: protocol version(1) + header size(1)
  // Byte1: full-client request(1) + event flag(4)
  // Byte2: JSON serialization(1) + no compression(0)
  const header = Buffer.from([0x11, 0x14, 0x10, 0x00]);
  const optional: Buffer[] = [int32BE(eventId)];

  if (sessionId) {
    const sid = Buffer.from(sessionId, "utf8");
    optional.push(int32BE(sid.length), sid);
  }

  const payloadBuf = Buffer.from(JSON.stringify(payload ?? {}), "utf8");
  return Buffer.concat([header, ...optional, int32BE(payloadBuf.length), payloadBuf]);
}

function shouldIncludeSessionId(eventId?: number): boolean {
  if (!eventId) return false;
  return eventId >= 100;
}

function parseFrame(raw: Buffer): ParsedFrame {
  if (raw.length < 8) {
    throw new Error("Invalid frame: too short");
  }

  const messageType = (raw[1] & 0b1111_0000) >> 4;
  const flags = raw[1] & 0b0000_1111;
  const serialization = (raw[2] & 0b1111_0000) >> 4;
  const compression = raw[2] & 0b0000_1111;

  let offset = 4;
  let eventId: number | undefined;
  let sessionId: string | undefined;

  if (flags === 0b0100) {
    eventId = raw.readInt32BE(offset);
    offset += 4;
  }

  if (shouldIncludeSessionId(eventId)) {
    const sessionSize = raw.readInt32BE(offset);
    offset += 4;
    if (sessionSize > 0) {
      sessionId = raw.subarray(offset, offset + sessionSize).toString("utf8");
      offset += sessionSize;
    }
  }

  const payloadSize = raw.readInt32BE(offset);
  offset += 4;
  const payload = raw.subarray(offset, offset + payloadSize);

  return {
    messageType,
    flags,
    serialization,
    compression,
    eventId,
    sessionId,
    payload,
  };
}

function toBuffer(data: WebSocket.RawData): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data);
}

function decodePayload(frame: ParsedFrame): unknown {
  if (frame.serialization !== 0b0001) return undefined;
  if (!frame.payload.length) return {};
  try {
    return JSON.parse(frame.payload.toString("utf8")) as unknown;
  } catch {
    return { raw: frame.payload.toString("utf8") };
  }
}

type FrameMatcher = (frame: ParsedFrame) => boolean;

async function waitForFrame(
  frames: ParsedFrame[],
  matcher: FrameMatcher,
  timeoutMs: number
): Promise<ParsedFrame> {
  const existing = frames.find(matcher);
  if (existing) return existing;

  return new Promise<ParsedFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      clearInterval(poll);
      reject(new Error("Timed out waiting for expected realtime event"));
    }, timeoutMs);

    const poll = setInterval(() => {
      const found = frames.find(matcher);
      if (found) {
        clearInterval(poll);
        clearTimeout(timer);
        resolve(found);
      }
    }, 20);
  });
}

export async function probeDoubaoRealtime(params: RealtimeProbeParams): Promise<RealtimeProbeResult> {
  const { text, model = "O", speaker, timeoutMs = 15_000 } = params;
  const env = getDoubaoRealtimeEnv();
  const sessionId = randomUUID();
  const connectId = randomUUID();

  const timeline: TimelineItem[] = [];
  const audioChunksBase64: string[] = [];
  const receivedFrames: ParsedFrame[] = [];
  let totalAudioBytes = 0;
  let chatText = "";
  const startAt = Date.now();

  const ws = new WebSocket(env.wsUrl, {
    headers: {
      "X-Api-App-ID": env.appId,
      "X-Api-Access-Key": env.accessKey,
      "X-Api-Resource-Id": env.resourceId,
      "X-Api-App-Key": env.appKey,
      "X-Api-Connect-Id": connectId,
    },
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Realtime websocket connect timeout")), timeoutMs);
    ws.once("open", () => {
      clearTimeout(timer);
      resolve();
    });
    ws.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const pushTimeline = (frame: ParsedFrame) => {
    const payload = decodePayload(frame);
    const item: TimelineItem = {
      eventId: frame.eventId,
      eventName: eventName(frame.eventId),
      at: Date.now(),
      payload,
    };
    if (frame.eventId === 352) {
      item.audioBytes = frame.payload.length;
    }
    timeline.push(item);
  };

  const listener = (data: WebSocket.RawData) => {
    const frame = parseFrame(toBuffer(data));
    receivedFrames.push(frame);
    pushTimeline(frame);

    if (frame.eventId === EVENT.ChatResponse) {
      const payload = decodePayload(frame) as { content?: string } | undefined;
      if (payload?.content) {
        chatText += payload.content;
      }
    }

    if (frame.eventId === 352) {
      totalAudioBytes += frame.payload.length;
      audioChunksBase64.push(frame.payload.toString("base64"));
    }
  };

  ws.on("message", listener);

  try {
    ws.send(buildJsonEventFrame(EVENT.StartConnection, {}));
    await waitForFrame(receivedFrames, (f) => f.eventId === EVENT.ConnectionStarted, timeoutMs);

    const startSessionPayload: Record<string, unknown> = {
      dialog: { extra: { model } },
    };
    if (speaker) {
      startSessionPayload.tts = { speaker };
    }

    ws.send(buildJsonEventFrame(EVENT.StartSession, startSessionPayload, sessionId));
    await waitForFrame(receivedFrames, (f) => f.eventId === EVENT.SessionStarted, timeoutMs);

    ws.send(buildJsonEventFrame(EVENT.ChatTextQuery, { content: text }, sessionId));
    await waitForFrame(receivedFrames, (f) => f.eventId === EVENT.TTSEnded, timeoutMs);

    ws.send(buildJsonEventFrame(EVENT.FinishSession, {}, sessionId));
    await waitForFrame(receivedFrames, (f) => f.eventId === EVENT.SessionFinished, 3_000).catch(() => {
      // SessionFinished may arrive late; do not fail probe.
    });
  } finally {
    ws.off("message", listener);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(buildJsonEventFrame(EVENT.FinishConnection, {}));
      ws.close();
    }
  }

  return {
    sessionId,
    chatText,
    eventTimeline: timeline,
    audioChunksBase64,
    totalAudioBytes,
    latencyMs: Date.now() - startAt,
  };
}
