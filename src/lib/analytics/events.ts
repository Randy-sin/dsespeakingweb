export const PRODUCT_EVENT_NAMES = [
  "site_session_started",
  "primary_cta_clicked",
  "paper_opened",
  "practice_started",
  "preparation_started",
  "recording_started",
  "recording_completed",
  "recording_failed",
  "text_fallback_opened",
  "transcription_completed",
  "transcription_failed",
  "analysis_completed",
  "analysis_failed",
  "discussion_turn_completed",
  "discussion_completed",
  "auth_started",
  "auth_completed",
  "auth_failed",
  "onboarding_completed",
  "lesson_completed",
  "flow_error",
] as const;

export const PRODUCT_EVENT_SURFACES = [
  "home",
  "onboarding",
  "papers",
  "learn",
  "practice",
  "auth",
] as const;

export const PRODUCT_EVENT_MODES = [
  "group-discussion",
  "individual-response",
] as const;

export const PRODUCT_EVENT_CONTEXTS = [
  "hero",
  "navigation",
  "onboarding",
  "paper-library",
  "paper-detail",
  "lesson",
  "practice-picker",
  "practice-session",
  "feedback",
  "login",
  "register",
  "oauth-callback",
] as const;

export const PRODUCT_EVENT_OUTCOMES = [
  "success",
  "failure",
  "cancelled",
  "blocked",
] as const;

export const PRODUCT_EVENT_INPUT_SOURCES = ["voice", "text-fallback"] as const;

export const PRODUCT_EVENT_ERROR_CODES = [
  "permission-denied",
  "device-unavailable",
  "unsupported-browser",
  "recording-failed",
  "network-failed",
  "unauthorized",
  "rate-limited",
  "invalid-input",
  "transcription-failed",
  "analysis-failed",
  "discussion-failed",
  "auth-failed",
  "server-error",
  "unknown",
] as const;

export const PRODUCT_EVENT_DURATION_BUCKETS = [
  "under-15s",
  "15-30s",
  "31-60s",
  "61-120s",
  "over-120s",
] as const;

export const PRODUCT_EVENT_LATENCY_BUCKETS = [
  "under-1s",
  "1-3s",
  "3-10s",
  "10-30s",
  "over-30s",
] as const;

export const PRODUCT_EVENT_AUTH_STATES = ["anonymous", "authenticated"] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
export type ProductEventSurface = (typeof PRODUCT_EVENT_SURFACES)[number];
export type ProductEventMode = (typeof PRODUCT_EVENT_MODES)[number];
export type ProductEventContext = (typeof PRODUCT_EVENT_CONTEXTS)[number];
export type ProductEventOutcome = (typeof PRODUCT_EVENT_OUTCOMES)[number];
export type ProductEventInputSource = (typeof PRODUCT_EVENT_INPUT_SOURCES)[number];
export type ProductEventErrorCode = (typeof PRODUCT_EVENT_ERROR_CODES)[number];
export type ProductEventDurationBucket = (typeof PRODUCT_EVENT_DURATION_BUCKETS)[number];
export type ProductEventLatencyBucket = (typeof PRODUCT_EVENT_LATENCY_BUCKETS)[number];
export type ProductEventAuthState = (typeof PRODUCT_EVENT_AUTH_STATES)[number];

export const PRODUCT_EVENT_SCHEMA_VERSION = 1 as const;
export const PRODUCT_EVENT_CONTENT_ID_MAX_LENGTH = 128;

export type ProductEvent = {
  name: ProductEventName;
  surface?: ProductEventSurface;
  mode?: ProductEventMode;
  context?: ProductEventContext;
  outcome?: ProductEventOutcome;
  inputSource?: ProductEventInputSource;
  errorCode?: ProductEventErrorCode;
  durationBucket?: ProductEventDurationBucket;
  latencyBucket?: ProductEventLatencyBucket;
  authState?: ProductEventAuthState;
  contentId?: string;
  round?: number;
  schemaVersion?: typeof PRODUCT_EVENT_SCHEMA_VERSION;
};

export type ProductEventEnvelope = Omit<ProductEvent, "schemaVersion"> & {
  id: string;
  schemaVersion: typeof PRODUCT_EVENT_SCHEMA_VERSION;
};

const EVENT_ENVELOPE_FIELDS = new Set([
  "id",
  "name",
  "surface",
  "mode",
  "context",
  "outcome",
  "inputSource",
  "errorCode",
  "durationBucket",
  "latencyBucket",
  "authState",
  "contentId",
  "round",
  "schemaVersion",
]);

const PRODUCT_EVENT_FIELDS = new Set(
  Array.from(EVENT_ENVELOPE_FIELDS).filter((field) => field !== "id"),
);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTENT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,127})$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnumValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function hasValidOptionalEnum<T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  values: T,
): boolean {
  return !(key in record) || isEnumValue(values, record[key]);
}

export function parseProductEventEnvelope(value: unknown): ProductEventEnvelope | null {
  if (!isRecord(value)) return null;

  const keys = Object.keys(value);
  if (keys.some((key) => !EVENT_ENVELOPE_FIELDS.has(key))) return null;
  if (typeof value.id !== "string" || !UUID_PATTERN.test(value.id)) return null;
  if (!isEnumValue(PRODUCT_EVENT_NAMES, value.name)) return null;
  if (value.schemaVersion !== PRODUCT_EVENT_SCHEMA_VERSION) return null;

  if (!hasValidOptionalEnum(value, "surface", PRODUCT_EVENT_SURFACES)) return null;
  if (!hasValidOptionalEnum(value, "mode", PRODUCT_EVENT_MODES)) return null;
  if (!hasValidOptionalEnum(value, "context", PRODUCT_EVENT_CONTEXTS)) return null;
  if (!hasValidOptionalEnum(value, "outcome", PRODUCT_EVENT_OUTCOMES)) return null;
  if (!hasValidOptionalEnum(value, "inputSource", PRODUCT_EVENT_INPUT_SOURCES)) return null;
  if (!hasValidOptionalEnum(value, "errorCode", PRODUCT_EVENT_ERROR_CODES)) return null;
  if (!hasValidOptionalEnum(value, "durationBucket", PRODUCT_EVENT_DURATION_BUCKETS)) return null;
  if (!hasValidOptionalEnum(value, "latencyBucket", PRODUCT_EVENT_LATENCY_BUCKETS)) return null;
  if (!hasValidOptionalEnum(value, "authState", PRODUCT_EVENT_AUTH_STATES)) return null;

  if (
    "contentId" in value &&
    (typeof value.contentId !== "string" ||
      value.contentId.length > PRODUCT_EVENT_CONTENT_ID_MAX_LENGTH ||
      !CONTENT_ID_PATTERN.test(value.contentId))
  ) {
    return null;
  }

  if (
    "round" in value &&
    (typeof value.round !== "number" || !Number.isInteger(value.round) || value.round < 1 || value.round > 20)
  ) {
    return null;
  }

  return value as ProductEventEnvelope;
}

export function createProductEventEnvelope(event: ProductEvent, id: string): ProductEventEnvelope | null {
  const eventRecord = event as Record<string, unknown>;
  if (Object.keys(eventRecord).some((key) => !PRODUCT_EVENT_FIELDS.has(key))) return null;

  const candidate = {
    ...event,
    id,
    schemaVersion: event.schemaVersion ?? PRODUCT_EVENT_SCHEMA_VERSION,
  } as Record<string, unknown>;

  for (const [key, value] of Object.entries(candidate)) {
    if (value === undefined && EVENT_ENVELOPE_FIELDS.has(key)) delete candidate[key];
  }

  return parseProductEventEnvelope(candidate);
}

export function bucketDuration(durationSeconds: number): ProductEventDurationBucket | undefined {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return undefined;
  if (durationSeconds < 15) return "under-15s";
  if (durationSeconds <= 30) return "15-30s";
  if (durationSeconds <= 60) return "31-60s";
  if (durationSeconds <= 120) return "61-120s";
  return "over-120s";
}

export function bucketLatency(latencyMilliseconds: number): ProductEventLatencyBucket | undefined {
  if (!Number.isFinite(latencyMilliseconds) || latencyMilliseconds < 0) return undefined;
  if (latencyMilliseconds < 1_000) return "under-1s";
  if (latencyMilliseconds < 3_000) return "1-3s";
  if (latencyMilliseconds < 10_000) return "3-10s";
  if (latencyMilliseconds < 30_000) return "10-30s";
  return "over-30s";
}

export function classifyAnalyticsOutcome(status: number): ProductEventOutcome {
  if (status >= 200 && status < 400) return "success";
  if ([401, 403, 409, 422, 429].includes(status)) return "blocked";
  return "failure";
}
