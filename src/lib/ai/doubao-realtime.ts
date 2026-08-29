import { randomUUID } from "crypto";
import type { IncomingMessage } from "node:http";
import WebSocket from "ws";
import { getDoubaoRealtimeEnv } from "./env";

export type DoubaoModel = "O" | "SC";
export type DoubaoInputMode = "text" | "audio_file";

interface RealtimeProbeParams {
  text: string;
  model?: DoubaoModel;
  speaker?: string;
  timeoutMs?: number;
  inputMode?: DoubaoInputMode;
  includeTtsPcmS16le?: boolean;
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
  errorCode?: number;
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
  let errorCode: number | undefined;
  let eventId: number | undefined;
  let sessionId: string | undefined;

  if (messageType === 0b1111) {
    errorCode = raw.readInt32BE(offset);
    offset += 4;
  }

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
    errorCode,
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

class DoubaoRealtimeError extends Error {
  code?: number;
  eventId?: number;
  payload?: unknown;

  constructor(message: string, opts?: { code?: number; eventId?: number; payload?: unknown }) {
    super(message);
    this.name = "DoubaoRealtimeError";
    this.code = opts?.code;
    this.eventId = opts?.eventId;
    this.payload = opts?.payload;
  }
}

export class DoubaoRealtimeEntitlementError extends Error {
  readonly reason = "resource_not_granted" as const;
  readonly status = 403;

  constructor() {
    super("Doubao realtime resource is not granted to this application");
    this.name = "DoubaoRealtimeEntitlementError";
  }
}

async function readUnexpectedResponseBody(response: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of response) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.length;
    if (totalBytes <= 4_096) chunks.push(bytes);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function isDoubaoRealtimeEntitlementResponse(
  statusCode: number | undefined,
  responseBody: string,
): boolean {
  if (statusCode !== 403) return false;
  try {
    const parsed = JSON.parse(responseBody) as { error?: unknown };
    return typeof parsed.error === "string" && parsed.error.includes("requested resource not granted");
  } catch {
    return false;
  }
}

function getFailureFrame(frames: ParsedFrame[]): ParsedFrame | undefined {
  return frames.find((f) => {
    if (f.messageType === 0b1111) return true;
    return f.eventId === EVENT.ConnectionFailed || f.eventId === EVENT.SessionFailed;
  });
}

function throwFailure(frame: ParsedFrame): never {
  const payload = decodePayload(frame) as { error?: string } | undefined;
  const fallbackMessage =
    payload?.error ||
    `Doubao realtime failure: messageType=${frame.messageType}, eventId=${frame.eventId ?? "n/a"}`;
  throw new DoubaoRealtimeError(fallbackMessage, {
    code: frame.errorCode,
    eventId: frame.eventId,
    payload,
  });
}

async function waitForFrame(
  frames: ParsedFrame[],
  matcher: FrameMatcher,
  timeoutMs: number
): Promise<ParsedFrame> {
  const existing = frames.find(matcher);
  if (existing) return existing;
  const failure = getFailureFrame(frames);
  if (failure) throwFailure(failure);

  return new Promise<ParsedFrame>((resolve, reject) => {
    const timer = setTimeout(() => {
      clearInterval(poll);
      reject(new Error("Timed out waiting for expected realtime event"));
    }, timeoutMs);

    const poll = setInterval(() => {
      const fail = getFailureFrame(frames);
      if (fail) {
        clearInterval(poll);
        clearTimeout(timer);
        reject(
          new DoubaoRealtimeError("Doubao realtime returned a failure event", {
            code: fail.errorCode,
            eventId: fail.eventId,
            payload: decodePayload(fail),
          })
        );
        return;
      }

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
  const {
    text,
    model = "O",
    speaker,
    timeoutMs = 15_000,
    inputMode = "text",
    includeTtsPcmS16le = true,
  } = params;
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

  try {
    await new Promise<void>((resolve, reject) => {
      let unexpectedResponseReceived = false;
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callback();
      };
      const timer = setTimeout(
        () => finish(() => reject(new Error("Realtime websocket connect timeout"))),
        timeoutMs,
      );
      ws.once("open", () => {
        finish(resolve);
      });
      ws.once("error", (err) => {
        if (!unexpectedResponseReceived) finish(() => reject(err));
      });
      ws.once("unexpected-response", (_request, response) => {
        unexpectedResponseReceived = true;
        void readUnexpectedResponseBody(response)
          .then((body) => {
            if (isDoubaoRealtimeEntitlementResponse(response.statusCode, body)) {
              finish(() => reject(new DoubaoRealtimeEntitlementError()));
              return;
            }
            finish(() => reject(new Error(`Doubao realtime handshake failed with status ${response.statusCode ?? "unknown"}`)));
          })
          .catch(() => {
            finish(() => reject(new Error(`Doubao realtime handshake failed with status ${response.statusCode ?? "unknown"}`)));
          });
      });
    });
  } catch (error) {
    ws.terminate();
    throw error;
  }

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
      dialog: { extra: { model, input_mod: inputMode } },
    };
    if (speaker) {
      startSessionPayload.tts = { speaker };
    }
    if (includeTtsPcmS16le) {
      startSessionPayload.tts = {
        ...(typeof startSessionPayload.tts === "object" ? (startSessionPayload.tts as object) : {}),
        audio_config: {
          channel: 1,
          format: "pcm_s16le",
          sample_rate: 24000,
        },
      };
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
