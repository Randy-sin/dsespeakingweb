# DSE Speaking 教學平台重構：設計方案

狀態：待設計確認
對應需求：[requirements.md](./requirements.md)

## 1. 設計目標

本次重構採用「新產品殼層 + 新學習功能模組」的方式重寫網站。現有真題、Supabase Auth、可用的服務端 AI 連接能力和基礎 UI 元件可以保留；房間、角色、LiveKit 和多人會議狀態不再作為新產品的基礎。

重寫後，每個主要頁面都應幫助學生完成以下循環：

```text
了解技巧 → 看正反例 → 完成短練習 → 查看具體回饋 → 重練或進入下一項
```

## 2. DESIGN SPECIFICATION

### 2.1 Purpose Statement

網站服務正在準備 HKDSE English Paper 4 的中學生，特別是缺少固定老師或練習伙伴、但願意自行練習的學生。介面需要讓學生迅速知道目前程度、今天要做甚麼，以及這次表現可以怎樣改進。

### 2.2 Aesthetic Direction

採用 **Editorial / magazine** 方向，具體視覺概念是「香港考試備課冊 + 老師批注稿」。頁面應有教材的可信度、紙本筆記的親切感和明確的學習層級，不採用視訊會議、企業 SaaS 或一般 AI 聊天工具的視覺語言。

### 2.3 Color Palette

| Token | 色值 | 用途 |
|---|---:|---|
| Paper | `#F3EFE4` | 全站主背景、教材底色 |
| Ink | `#172019` | 主要文字、主按鈕、深色區塊 |
| Exam Red | `#C84B31` | 重點、批注、進度和錯誤提示 |
| Moss | `#48634C` | 完成狀態、正向回饋、次要操作 |
| Pencil | `#8A8175` | 輔助文字、邊框、未完成狀態 |

禁止使用紫色、靛色、紫藍漸變或無意義的彩色裝飾。背景以紙張層次、細線、頁邊標記和極輕顆粒感建立深度。

### 2.4 Typography

- `Newsreader`：英文標題、引言、關鍵數字和教學示例。
- `Noto Sans TC`：繁體中文正文、導航、表單和按鈕。
- `IBM Plex Mono`：計時、Level、題號、進度編號和技術性短標籤。

字體由 `next/font/google` 載入並輸出為 CSS 變數，避免字體閃動和第三方執行階段請求。

### 2.5 Layout Strategy

桌面採用非對稱 12 欄「學習軌道」：左側 2 欄作進度脊柱，中間 7 欄放主教材，右側 3 欄放提示、詞句和老師批注。局部紙張標籤可以跨欄、輕微重疊或偏移，形成翻閱備課冊的節奏。

手機版改成單欄閱讀，但保留左側進度線、頁邊標記和底部固定練習操作。主要操作必須落在拇指容易觸及的位置，不能把桌面三欄直接縮小。

### 2.6 Icons and Motion

- 全站只使用 `lucide-react` 圖標，不使用 emoji 作功能圖標。
- 首次載入可使用一次分段揭示動畫；課程完成、錄音開始和分析完成使用短促狀態動畫。
- 遵循 `prefers-reduced-motion`；關閉動效後不得影響信息理解。

## 3. 資訊架構與路由

### 3.1 主要路由

| 路由 | 用途 | 登入要求 |
|---|---|---|
| `/` | 新產品首頁 | 否 |
| `/onboarding` | 四步能力與目標設定 | 否 |
| `/learn` | 個人學習首頁與今日計劃 | 否；登入後同步 |
| `/learn/group-discussion` | GD 課程地圖 | 否 |
| `/learn/group-discussion/[lessonSlug]` | GD 單課教學與短練習 | 否 |
| `/learn/individual-response` | IR 題型課程地圖 | 否 |
| `/learn/individual-response/[lessonSlug]` | IR 單課教學與短練習 | 否 |
| `/practice/group-discussion` | GD 選題與練習設定 | 否；完整 AI 次數可按帳戶限制 |
| `/practice/group-discussion/session` | AI 小組討論練習 | 否 |
| `/practice/individual-response` | IR 選題與練習設定 | 否 |
| `/practice/individual-response/session` | 1 分鐘錄音練習 | 否 |
| `/practice/results/[sessionId]` | 回饋與重練 | 本地訪客或紀錄擁有人 |
| `/papers`、`/papers/[paperId]` | 真題探索及練習入口 | 否 |
| `/progress` | 歷史、趨勢與弱項 | 是；訪客顯示登入同步說明 |

### 3.2 舊路由處理

- `/rooms`、`/rooms/create` → `/practice/group-discussion`
- `/rooms/[id]`、`/rooms/[id]/session` → `/practice/group-discussion`
- 登入成功後預設跳轉由 `/rooms` 改為 `/learn`
- `/forum` 第一階段不放在主導航；舊 URL 暫時可直接開啟

舊路由先使用永久導向以保留書籤和搜尋引擎入口。正式切換前先檢查是否仍有已分享的有效房間；若有，改用暫時導向並提供退場提示。

## 4. 頁面設計

### 4.1 首頁

首屏採用左 7 欄主敘事、右 5 欄「今天的練習頁」預覽。主標題說明學生能學會怎樣說，而不是找到誰一起說。

首屏之後依次展示：

1. 三步學習循環：學技巧、開口練、看回饋。
2. GD 與 IR 兩條學習路徑的差異。
3. 一個真實的「原答法 → 批注 → 改進答法」示例。
4. 真題如何進入練習。
5. 開始 onboarding 的收束操作。

### 4.2 Onboarding

Onboarding 使用單題逐步表單。桌面左側顯示 4 個步驟及目前狀態，右側是當前問題；手機只保留頂部進度和當前問題。

最後一頁不顯示虛構的能力分數，而是生成一份有理由的首週計劃，例如：

```text
先練「回應並加入新資訊」
原因：你選擇了「有想法，但接不上別人的話」。
本週安排：2 節技巧課 + 1 次 8 分鐘練習。
```

### 4.3 個人學習首頁

桌面左側是本週進度脊柱；中央放唯一的主要任務；右側放最近回饋、連續練習和快速練習。頁面不能同時出現多個同等權重的 CTA。

沒有歷史時顯示完整新手路徑；已有歷史時顯示「繼續上次內容」和弱項推薦。

### 4.4 課程頁

每節課使用固定教學節奏：

1. 今日要學會的行為。
2. 一個不理想示例。
3. 老師批注：問題出在哪裏。
4. 改進示例及可重用結構。
5. 30–90 秒短練習。
6. 即時解釋與下一步。

課程進度以左側垂直軌道顯示，不使用大量同形卡片堆疊。

### 4.5 練習頁

GD 練習採用「題目頁 + 說話軌道」：題目和討論點固定在一側；AI 考生與學生發言按時間排列。AI 角色以姓名、能力和說話方式區分，不使用卡通化頭像。

IR 練習採用「考官題卡 + 錄音稿紙」：計時器、錄音控制和結構提示同時可見；錄音後在原稿上直接加入句段批注。

### 4.6 回饋頁

先顯示一句可執行結論，再顯示證據和維度，不先用雷達圖壓住學生。每一項回饋都連到轉寫片段或時間點。

頁面順序：

1. 這次最值得保留的行為。
2. 下一次只改的一至三件事。
3. 帶批注的轉寫。
4. 四維表現及趨勢。
5. 示範答法、可重用表達和「重練這一題」。

## 5. 前端架構

### 5.1 目錄邊界

```text
src/
├── app/
│   ├── (marketing)/
│   ├── onboarding/
│   ├── learn/
│   ├── practice/
│   ├── papers/
│   ├── progress/
│   └── api/practice/
├── components/
│   ├── layout/
│   └── ui/
├── features/
│   ├── onboarding/
│   ├── learning-path/
│   ├── group-discussion/
│   ├── individual-response/
│   ├── recording/
│   └── feedback/
├── content/
│   ├── group-discussion/
│   └── individual-response/
└── lib/
    ├── ai/
    ├── learning/
    ├── recording/
    └── supabase/
```

`app` 只負責路由、資料載入和頁面組裝；具體練習狀態放在 `features`；靜態教學內容放在有 TypeScript 類型約束的 `content`。不得把整個練習流程塞入單一 client component。

### 5.2 渲染策略

- 首頁、課程目錄、課程正文和真題詳情優先使用 Server Components。
- Onboarding、錄音器、計時器和互動練習使用小範圍 Client Components。
- 錄音和波形模組按需載入，避免加入首頁 JavaScript。
- 使用 Next.js Metadata API 為課程和真題建立可索引標題與描述。

### 5.3 狀態策略

- 訪客 onboarding 與課程進度存入版本化本地資料 `dse-learning-profile:v1`。
- 練習中的短期狀態使用 feature-level reducer，避免多個互相驅動的 `useEffect`。
- 登入後由同步層把本地進度合併至 Supabase；衝突時以較新的 `updated_at` 為準，練習紀錄只追加、不覆寫。
- AI 練習採用明確狀態機：`setup → preparing → recording → transcribing → responding/analyzing → results → failed`。

## 6. AI 與語音架構

### 6.1 原則

- 瀏覽器不持有 AI、ASR 或 TTS 服務密鑰。
- 第一個可審閱切片先完成可靠的本地錄音、回放和教學流程，不用假回饋冒充 AI 結果。
- 完整 AI 練習使用「逐輪 HTTP」而不是長連線會議室：學生錄一輪，服務端轉寫，AI 生成下一位考生回應，再回傳文字及音訊。

### 6.2 服務邊界

```text
Browser MediaRecorder
  → private audio upload / short-lived request
  → ASR adapter
  → DSE practice orchestrator
  → LLM feedback or AI candidate response
  → TTS adapter
  → transcript + evidence + signed audio URL
```

AI 供應商封裝在 adapter 後面。現有 Doubao 連接可作其中一個 adapter，但必須移除 `roomId` 與 `room_members` 的耦合。若後續更換供應商，頁面和練習狀態不應重寫。

### 6.3 API 草案

| 方法與路徑 | 用途 | 主要輸入 |
|---|---|---|
| `POST /api/practice/transcribe` | 轉寫單次錄音 | audio reference、locale |
| `POST /api/practice/ir/analyze` | 分析 IR 答案 | question、transcript、duration |
| `POST /api/practice/gd/respond` | 生成下一位 AI 考生回應 | paper context、turns、persona |
| `POST /api/practice/gd/analyze` | 生成 GD 回饋 | paper context、完整 turns、timing |

所有輸入在服務端進行大小、類型、擁有權和狀態驗證。錯誤回應使用穩定錯誤碼，頁面只顯示可理解的影響和恢復方法，不顯示供應商原始錯誤。

## 7. Supabase 資料設計

### 7.1 保留資料

- 保留 `pastpaper_papers` 及現有真題圖片。
- 保留 Supabase Auth、`profiles` 及 SSR session 基礎。
- 第一階段保留 `rooms`、`room_members`、`marker_scores` 和論壇資料，不做破壞性 migration。

### 7.2 新資料表草案

| 資料表 | 主要欄位 | 用途 |
|---|---|---|
| `learner_profiles` | `user_id`、exam year、target level、weak areas、weekly minutes | Onboarding 與推薦基礎 |
| `lesson_progress` | `user_id`、lesson slug、status、mastery、updated_at | 課程完成與掌握度 |
| `practice_sessions` | `id`、`user_id`、mode、paper_id、status、duration、feedback、created_at | 每次 GD／IR 練習摘要 |
| `practice_turns` | `session_id`、speaker type、sequence、transcript、audio path、timing、evidence | GD 發言或 IR 錄音明細 |

教學課程本身先存於版本控制中的 TypeScript 內容檔，避免在產品方向仍調整時引入 CMS。資料表使用 UUID、外鍵、必要索引和明確 `updated_at`。

### 7.3 RLS 與儲存

- 所有使用者資料表啟用 RLS，只允許 `auth.uid() = user_id` 的擁有人讀寫。
- 更新策略同時使用 `USING` 和 `WITH CHECK`。
- 訪客資料不寫入公開資料表，只存在本機；登入同步後才建立帳戶紀錄。
- 錄音放入 private bucket，以 `user_id/session_id` 作路徑；只由擁有人或服務端短期簽名 URL 存取。
- 前端只使用 publishable／anon 類型金鑰，絕不暴露 `service_role`。

正式編寫 migration 前，必須核對 Supabase 最新 changelog、Auth／RLS／Storage 文件和目前 CLI 指令；migration 必須由 Supabase CLI 建立並經 advisors 檢查。

## 8. 舊代碼退場策略

整站重寫不等於一次刪光。採用可回退的四階段切換：

1. **建立新殼層**：加入新設計 tokens、導航、首頁、onboarding、`/learn` 和 `/practice`，舊房間仍可直接開啟。
2. **切換主要入口**：首頁、導航、登入跳轉和真題 CTA 全部指向新流程；舊房間路由開始導向。
3. **替換服務能力**：把 AI、錄音、計時和回饋轉為不依賴 room 的 feature modules。
4. **刪除遺留代碼**：在全域搜尋確認零引用後，刪除 `components/livekit`、`components/room`、`components/session`、room hooks、room API 及 LiveKit 套件。

刪除生產資料表屬另一項破壞性操作，必須先確認資料備份、使用量和回退方案。

## 9. 錯誤與邊界狀態

| 狀態 | 界面處理 |
|---|---|
| 未允許麥克風 | 說明影響，提供重新授權步驟及文字練習入口 |
| 瀏覽器不支援錄音格式 | 自動嘗試支援格式；仍不可用時切換文字模式 |
| 上傳／轉寫失敗 | 保留本地錄音，提供重試和下載原錄音 |
| AI 分析逾時 | 保留轉寫，允許稍後重新分析，不生成假分數 |
| 未登入 | 保存本地進度，在需要跨裝置時提示登入 |
| 真題資料缺失 | 顯示缺失類型並返回題庫，不顯示空白頁 |
| 同步衝突 | 練習紀錄只追加；設定採較新的時間版本並提示結果 |

## 10. 可用性、效能與 SEO

- 主要操作具有可見焦點、44 px 或以上觸控區、語義標題與表單標籤。
- 色彩不是唯一狀態提示；計時和評分同時提供文字。
- 初始首頁不載入錄音、AI 或圖表程式碼。
- 真題圖片保留尺寸資訊並延遲載入；首屏圖像使用明確優先級。
- 所有學習頁提供獨立 metadata、canonical URL 和可讀的內容摘要。
- 學生錄音、轉寫和分析頁預設不被搜尋引擎索引。

## 11. 驗證策略

### 11.1 自動檢查

- `npx tsc --noEmit`
- `npm run lint`
- 使用正式所需環境變數執行 `npm run build`
- 為 onboarding 推薦、課程進度 reducer、錄音狀態機和 AI 回應驗證加入單元測試
- 全域搜尋確認新流程不引用 LiveKit、room role 或 marker 狀態

### 11.2 瀏覽器驗證

桌面和手機至少驗證：

1. 首頁 → onboarding → 首週計劃。
2. 首週計劃 → GD 課程 → 短練習 → 完成。
3. IR 選題 → 麥克風說明 → 錄音 → 回放 → 重錄。
4. 真題詳情 → Part A／Part B 對應練習。
5. 訪客進度 → 登入 → 同步後返回原位置。
6. 麥克風拒絕、離線、AI 逾時和空資料狀態。
7. 舊 `/rooms` URL 的導向與返回路徑。

### 11.3 狀態定義

- 通過 typecheck、lint 和 build，只代表程式碼檢查通過。
- 本機瀏覽器完整走通後，才稱為「本地完成」。
- 部署後在正式 URL 重新驗證，才稱為「已上線」。

## 12. 主要取捨

### 12.1 不直接改造房間模型

房間模型以多人同步、角色權限和長連線為中心，與個人教學的狀態、資料和錯誤處理方向不同。繼續沿用會讓每項新功能都依賴不存在的房間成員，因此選擇建立新的 practice session 模型。

### 12.2 不在第一個切片假裝完成 AI 評分

錄音、轉寫、供應商錯誤、證據綁定和資料保存需要一起驗證。第一個切片先交付真實可用的教學與錄音，再接入能引用轉寫證據的 AI 回饋。

### 12.3 暫不刪除舊資料表

刪除資料不可逆且不是新體驗成立的必要條件。第一階段只切斷新產品依賴；待正式使用量和資料備份確認後，再單獨處理資料庫清理。
