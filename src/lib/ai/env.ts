export interface DoubaoRealtimeEnv {
  appId: string;
  accessKey: string;
  resourceId: string;
  appKey: string;
  wsUrl: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDoubaoRealtimeEnv(): DoubaoRealtimeEnv {
  return {
    appId: requireEnv("DOUBAO_APP_ID"),
    accessKey: requireEnv("DOUBAO_ACCESS_KEY"),
    resourceId: process.env.DOUBAO_RESOURCE_ID?.trim() || "volc.speech.dialog",
    appKey: process.env.DOUBAO_APP_KEY?.trim() || "PlgvMymc7f3tQnJ6",
    wsUrl:
      process.env.DOUBAO_REALTIME_WS_URL?.trim() ||
      "wss://openspeech.bytedance.com/api/v3/realtime/dialogue",
  };
}
