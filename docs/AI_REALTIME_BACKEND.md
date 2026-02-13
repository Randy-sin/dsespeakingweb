# Doubao Realtime Backend Guide

This project now includes a backend-only realtime integration for Doubao speech-to-speech APIs.

## Source Specification

- Official doc: https://www.volcengine.com/docs/6561/1594356?lang=zh

## Environment Variables

Required:

- `DOUBAO_APP_ID`
- `DOUBAO_ACCESS_KEY`

Optional (defaults are configured in code):

- `DOUBAO_RESOURCE_ID` (default: `volc.speech.dialog`)
- `DOUBAO_APP_KEY` (default: `PlgvMymc7f3tQnJ6`)
- `DOUBAO_REALTIME_WS_URL` (default: `wss://openspeech.bytedance.com/api/v3/realtime/dialogue`)

## Endpoints

### 1) POST `/api/ai/realtime/probe`

Purpose:

- Authenticated debug probe for realtime chain.
- Optional room access check when `roomId` is provided.

Request body:

```json
{
  "text": "Hello, can we practice speaking?",
  "roomId": "optional-room-id",
  "model": "O",
  "inputMode": "text",
  "speaker": "optional-speaker-id",
  "timeoutMs": 15000,
  "includeAudioChunks": false
}
```

### 2) POST `/api/ai/realtime/respond`

Purpose:

- Business route for room-based AI response.
- Requires authenticated user and `room_members` membership.

Request body:

```json
{
  "roomId": "required-room-id",
  "text": "Give me a counter argument in English.",
  "model": "O",
  "inputMode": "text",
  "speaker": "optional-speaker-id",
  "timeoutMs": 15000,
  "includeAudioChunks": false
}
```

Response fields:

- `ok`
- `chatText`
- `latencyMs`
- `audioChunkCount`
- `totalAudioBytes`
- `eventTimeline`
- `audioChunksBase64` (only when explicitly requested)

## cURL Examples

```bash
curl -X POST http://localhost:3000/api/ai/realtime/probe \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Hi, let us start DSE practice.",
    "model":"O",
    "inputMode":"text"
  }'
```

```bash
curl -X POST http://localhost:3000/api/ai/realtime/respond \
  -H "Content-Type: application/json" \
  -d '{
    "roomId":"<room-id>",
    "text":"Please challenge my opinion in 2 short points.",
    "model":"O",
    "inputMode":"text"
  }'
```

## Notes for Frontend Integration

- Send text queries first (`inputMode=text`) to minimize complexity.
- Only request `audioChunksBase64` when playback is needed.
- Treat `eventTimeline` as debug telemetry; do not render raw payloads in user-facing UI.

## Troubleshooting

- `401 Unauthorized`: Supabase session missing/expired.
- `403 Not a member of this room`: caller is not in `room_members`.
- `500 ... failure event`: upstream realtime returned failure frame or session failed.
- Timeout errors:
  - increase `timeoutMs` to 20-30s for unstable networks.
  - check Doubao service quota and API key status.
