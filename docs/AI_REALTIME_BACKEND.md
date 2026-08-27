# Doubao Realtime Backend Guide

This project includes a backend-only realtime adapter used by the DSE learning and practice APIs.

## Source Specification

- 豆包端到端實時語音大模型：https://www.volcengine.com/docs/6561/1594356?lang=zh
- 大模型錄音文件極速版識別 API：https://www.volcengine.com/docs/6561/1631584?lang=zh

## Environment Variables

Required:

- `DOUBAO_APP_ID`
- `DOUBAO_ACCESS_KEY`

Optional (defaults are configured in code):

- `DOUBAO_RESOURCE_ID` (default: `volc.speech.dialog`)
- `DOUBAO_APP_KEY` (default: `PlgvMymc7f3tQnJ6`)
- `DOUBAO_REALTIME_WS_URL` (default: `wss://openspeech.bytedance.com/api/v3/realtime/dialogue`)
- `DOUBAO_ASR_RESOURCE_ID` (default: `volc.bigasr.auc_turbo`)
- `DOUBAO_ASR_URL` (default: `https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash`)

## Endpoints

### 1) POST `/api/ai/group-discussion/respond`

Purpose:

- Authenticated, room-independent AI discussion turn.

Request body:

```json
{
  "context": "Discuss how the school can promote reading.",
  "learnerTurn": "I think the school can offer prizes.",
  "sessionId": "optional-existing-practice-session-id"
}
```

成功後，介面會傳回 AI 組員的回應，並把學習者與 AI 的兩次發言儲存到使用者自己的 `practice_sessions` 和 `practice_turns` 記錄。

### 2) POST `/api/ai/practice/analyze`

Purpose:

- Produces formative feedback grounded in a supplied transcript.
- Does not return an official examination score.

Request body:

```json
{
  "mode": "individual-response",
  "task": "Do you support using AI for homework?",
  "transcript": "I support it because...",
  "sessionId": "optional-existing-practice-session-id"
}
```

介面會傳回四個基於逐字稿的訓練維度。每個維度包含 `trainingLevel`、`evidence` 和 `nextStep`。介面不會評估發音、可聽流暢度、節奏或眼神交流，也不會傳回官方考試分數。

### 3) POST `/api/ai/transcribe`

用途：

- 接收已登入使用者明確提交的錄音。
- 使用 `multipart/form-data` 上傳 `audio`、`mode` 和 `task`。
- 伺服器接受 WAV、MP3 和 OGG，單一檔案不得超過 15 MB。
- 瀏覽器錄音會在用戶端轉為單聲道 PCM WAV 後再上傳，避免把 WebM 直接傳送給只支援指定格式的識別介面。
- 識別完成後，介面會把逐字稿儲存到使用者自己的練習記錄。除非使用者另行選擇儲存原始錄音，否則伺服器只會儲存逐字稿。

主要回應欄位：

- `ok`
- `assessment` 或 `response`
- `sessionId`
- `persisted`
- `latencyMs`
- `evidenceSource`（仅分析接口）

## Notes for Frontend Integration

- `/api/ai/transcribe` 已連接火山引擎 `volc.bigasr.auc_turbo`。目前應用程式已開通 20 小時、2 個並行要求的免費試用。
- 支援 Web Speech API 的瀏覽器仍可能在錄音時產生可編輯草稿。草稿屬於未核實內容，不等同於火山引擎逐字稿。
- Keep the browser recording and learner transcript when analysis fails.
- Never display generated feedback as an official HKDSE mark.
- Both learning endpoints require a same-origin JSON request and a valid Supabase user session. Cross-origin or origin-less calls are rejected before an AI provider request is made.

## Troubleshooting

- `401 Unauthorized`: Supabase session missing/expired.
- `403 Forbidden request origin`：要求不是來自同源頁面。
- `413 Request body is too large`：JSON 要求或錄音超過介面限制。
- `415 Unsupported content type`：要求內容或錄音格式不受支援。
- `503 Transcription service is not enabled...`：目前火山應用程式未開通 `volc.bigasr.auc_turbo`，或權限尚未生效。
- `500 ... failure event`: upstream realtime returned failure frame or session failed.
- Timeout errors:
  - increase `timeoutMs` to 20-30s for unstable networks.
  - check Doubao service quota and API key status.
