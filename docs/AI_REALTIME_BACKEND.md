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

如果豆包明確傳回 `volc.speech.dialog` 未獲授權，介面會改為傳回規則式討論練習卡。練習卡不會冒充 AI 組員、不會寫入 AI 發言，也不會增加已完成討論輪次。

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

如果豆包明確傳回 `volc.speech.dialog` 未獲授權，介面會改為傳回規則式基本提示。基本提示只檢查字數、句段和明確出現的連接或互動句型，不會傳回 `trainingLevel`，也不會標示為 AI 評分。

### 3) POST `/api/ai/transcribe`

用途：

- 接收已登入使用者明確提交的錄音。
- 使用 `multipart/form-data` 上傳 `audio`、`mode` 和 `task`。
- 伺服器接受 WAV、MP3 和 OGG，單一檔案不得超過 15 MB。
- 瀏覽器錄音會在用戶端轉為單聲道 PCM WAV 後再上傳，避免把 WebM 直接傳送給只支援指定格式的識別介面。
- 識別完成後，介面會把逐字稿儲存到使用者自己的練習記錄。除非使用者另行選擇儲存原始錄音，否則伺服器只會儲存逐字稿。

主要回應欄位：

- `ok`
- `resultMode`：`ai_assessment`、`ai_teammate` 或 `basic_coaching`
- `assessment`、`response` 或 `basicCoaching`，由 `resultMode` 決定
- `sessionId`
- `persisted`
- `latencyMs`
- `evidenceSource`（僅分析介面）

## 供應商未授權時的行為

只有以下條件全部成立時，分析與討論介面才使用規則式基本提示：

1. 豆包 WebSocket 握手傳回 HTTP `403`。
2. JSON 錯誤內容明確包含 `requested resource not granted`。

其他認證錯誤、限流、輸入錯誤、模型輸出解析錯誤和資料儲存錯誤仍會使要求失敗。系統不會用基本提示掩蓋這些錯誤。

`/api/ai/transcribe` 不提供規則式降級。系統不能在沒有語音識別服務時推測或生成逐字稿。

分析資料會分開記錄：

- 真正 AI 成功使用 `analysis_completed` 或 `discussion_turn_completed`。
- 規則式基本提示使用 `basic_coaching_delivered`，不計入 AI 學習價值漏斗。
- 供應商授權失敗仍保留 `analysis_failed` 或 `flow_error`，用於監控服務異常。

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
- WebSocket HTTP `403`，內容包含 `requested resource not granted`：目前 APP ID 尚未獲授 `volc.speech.dialog`。在豆包語音控制台為同一應用開通端到端實時語音大模型，再重新執行正式環境驗收。
- `500 ... failure event`: upstream realtime returned failure frame or session failed.
- Timeout errors:
  - increase `timeoutMs` to 20-30s for unstable networks.
  - check Doubao service quota and API key status.
