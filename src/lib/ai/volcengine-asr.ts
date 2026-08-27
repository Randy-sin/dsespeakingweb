import { randomUUID } from "crypto";

const DEFAULT_ASR_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash";
const DEFAULT_ASR_RESOURCE_ID = "volc.bigasr.auc_turbo";

type VolcengineAsrBody = {
  audio_info?: { duration?: number };
  result?: { text?: string };
};

export type AsrTranscript = {
  transcript: string;
  durationMs: number | null;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function providerError(statusCode: string, message: string | null) {
  if (statusCode === "20000003") return new Error("No recognisable speech was found in the recording");
  if (statusCode === "45000151") return new Error("The recording format could not be recognised");
  if (statusCode === "45000030") return new Error("Transcription service is not enabled for this application");
  if (statusCode === "55000031") return new Error("Transcription service is temporarily busy");
  return new Error(message ? `Transcription provider rejected the recording: ${message}` : "Transcription provider rejected the recording");
}

export async function transcribeWithVolcengine(audio: Buffer): Promise<AsrTranscript> {
  const appId = requireEnv("DOUBAO_APP_ID");
  const accessKey = requireEnv("DOUBAO_ACCESS_KEY");
  const response = await fetch(process.env.DOUBAO_ASR_URL?.trim() || DEFAULT_ASR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Key": appId,
      "X-Api-Access-Key": accessKey,
      "X-Api-Resource-Id": process.env.DOUBAO_ASR_RESOURCE_ID?.trim() || DEFAULT_ASR_RESOURCE_ID,
      "X-Api-Request-Id": randomUUID(),
      "X-Api-Sequence": "-1",
    },
    body: JSON.stringify({
      user: { uid: appId },
      audio: { data: audio.toString("base64") },
      request: { model_name: "bigmodel", enable_punc: true, enable_itn: true },
    }),
    signal: AbortSignal.timeout(35_000),
  });

  const statusCode = response.headers.get("x-api-status-code") ?? String(response.status);
  const message = response.headers.get("x-api-message");
  const body = (await response.json().catch(() => ({}))) as VolcengineAsrBody;
  if (!response.ok || statusCode !== "20000000") throw providerError(statusCode, message);

  const transcript = body.result?.text?.trim();
  if (!transcript) throw new Error("No recognisable speech was found in the recording");
  return {
    transcript,
    durationMs: typeof body.audio_info?.duration === "number" ? body.audio_info.duration : null,
  };
}
