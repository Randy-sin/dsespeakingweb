# DSE Speaking 教學平台重構：實施任務

狀態：已獲授權，實施中
需求：[requirements.md](./requirements.md)
設計：[design.md](./design.md)

- [x] 1. 建立新視覺基礎與產品殼層
  - 更新字體、色彩 tokens、紙張紋理、動效和無障礙基礎。
  - 重寫全站導航、手機選單、頁尾和 metadata。
  - 建立共用教材標籤、進度線、批注、主要操作和狀態元件。
  - _Requirement: R1, R11_

- [x] 2. 建立教學內容與本地學習狀態
  - 定義 GD、IR 課程和練習的 TypeScript 模型。
  - 從 iOS 參考內容整理首批 GD／IR 課程資料。
  - 建立版本化訪客 profile、課程進度和推薦邏輯。
  - _Requirement: R2, R3, R4, R6, R7_

- [x] 3. 重寫首頁
  - 建立「學方法、開口練、看回饋」首屏和互動練習預覽。
  - 加入 GD／IR 路徑、答法批注、真題入口和 onboarding CTA。
  - 移除會議室、真人組隊、Marker、Spectator 和 WebRTC 文案。
  - _Requirement: R1, R10_

- [x] 4. 實作 Onboarding 與個人學習首頁
  - 完成四步 onboarding、返回、略過和本地保存。
  - 根據答案生成可解釋的首週計劃。
  - 完成新手與已開始學習兩種 `/learn` 狀態。
  - _Requirement: R2, R3, R9_

- [x] 5. 實作 Group Discussion 教學路徑
  - 完成 GD 課程地圖和首批互動技巧內容。
  - 實作「回應並加入新資訊」完整課程與短練習。
  - 建立 GD 選題、準備筆記和 AI 討論 session 殼層。
  - _Requirement: R4, R5_

- [x] 6. 實作 Individual Response 教學與錄音
  - 完成五類 IR 課程地圖和 Making Choices 完整課程。
  - 實作題目選擇、1 分鐘計時、MediaRecorder、回放和重錄。
  - 提供麥克風拒絕、不支援格式和文字模式。
  - _Requirement: R6, R9, R11_

- [x] 7. 整合真題並切換舊入口
  - 在真題詳情加入「學這題」、「練 Part A」、「練 Part B」。
  - 將登入後跳轉和主要 CTA 改為新學習流程。
  - 將舊 `/rooms` 路由安全導向 GD 練習。
  - _Requirement: R8, R10_

- [x] 8. 建立 AI、語音與回饋服務邊界
  - 將既有 Doubao 能力封裝為不依賴 `roomId` 的 adapter。
  - 建立轉寫、IR 分析、GD 回應和 GD 分析 API。
  - 回饋綁定轉寫證據；失敗時保留錄音和轉寫。
  - _Requirement: R5, R6, R7, R11_

- [x] 9. 建立 Supabase 學習資料與同步
  - 核對最新 Supabase changelog 和相關文件。
  - 建立 learner profile、lesson progress、practice session／turn migrations 與 RLS。
  - 實作訪客資料登入後合併和 private recording storage。
  - _Requirement: R2, R3, R7, R9, R11_

- [x] 10. 移除不再使用的會議室代碼
  - 全域確認新流程不引用 room、marker、spectator 或 LiveKit。
  - 刪除舊頁面、元件、hooks、API 和 LiveKit 依賴。
  - 保留舊資料表，另列生產資料清理任務。
  - _Requirement: R10_

- [x] 11. 完成工程與瀏覽器驗證
  - 通過 typecheck、lint、測試和 production build。
  - 在桌面與 390 px 手機視口走通主要路徑和錯誤狀態。
  - 對照 Motion Sites 參考和設計規格完成視覺 QA。
  - 記錄本地完成、未驗證項和正式部署邊界。
  - _Requirement: R1-R11_

- [x] 12. 收束整站學習體驗
  - 將首頁主操作改為按 onboarding 與完成進度動態推薦下一步。
  - 重整學習首頁、課程地圖、練習入口和進度頁，讓每一頁只有一個清晰的下一步。
  - 統一桌面與手機導航、進度入口、鍵盤焦點和「跳到主要內容」能力。
  - 移除全站殘留的巢狀互動元素，並完成桌面與 390 px 回歸。
  - _Requirement: R1, R3, R4, R6, R7, R9, R11_

## 驗證備註

- 2026-08-27 再次通過 TypeScript、ESLint、production build，以及桌面與 390 px 手機主要路由回歸；瀏覽器沒有新增 warning/error。
- 兩個學習平台 migration 已套用到目前連線的 Supabase 專案；匿名資料表存取、RLS 邊界與已登入回滾式 E2E 已驗證。正式發佈前仍需用正式帳號做一次非回滾 acceptance。
- 火山控制台已為目前應用程式開通「錄音文件識別大模型—極速版」免費試用：20 小時、2 個並行要求。使用真實 7.4 秒英文 WAV 呼叫 `volc.bigasr.auc_turbo`，介面傳回正確英文逐字稿。
- `/api/ai/transcribe` 已接入真實識別服務。瀏覽器錄音會在用戶端轉成 WAV；只有已登入使用者明確按下「生成 AI 逐字稿」後，錄音才會傳送給識別服務。
- 逐字稿分析已改為四維結構化訓練量表。真實豆包呼叫傳回指定四個維度、逐字稿證據和下一步建議；介面明確標示這是訓練訊號，不是 HKEAA 官方分數，也不評估發音等錄音專屬表現。
- AI 逐字稿、訓練量表和小組討論發言已接入 Supabase 私人練習記錄。authenticated 角色已完成 1 個 session、2 個 turns 的寫入與讀取，並在同一交易中復原；復原後兩張表仍為 0 筆測試記錄。
- 仍缺正式學生登入狀態的瀏覽器完整流程驗收。匿名邊界、真實供應商呼叫、資料庫登入角色寫入和生產建置已分別通過，但不能把這些結果合併視為正式登入狀態 UI 驗收。
- 本輪只完成本地程式與既有線上 Supabase schema 驗證，未提交 Git、未推送 GitHub，也未部署網站。
