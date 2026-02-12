# DSE Speaking Practice Platform

> 一個為香港 DSE 英文科 Paper 4 (Speaking) 設計的在線模擬練習平台，支持多人實時音視頻討論、考官評分、觀眾旁聽，完整還原 DSE 口試流程。

---

## 目錄

- [項目簡介](#項目簡介)
- [核心功能](#核心功能)
- [技術架構](#技術架構)
- [數據庫設計](#數據庫設計)
- [頁面路由](#頁面路由)
- [目錄結構](#目錄結構)
- [本地開發](#本地開發)
- [環境變量](#環境變量)
- [部署](#部署)

---

## 項目簡介

DSE Speaking Practice 是一個面向香港 DSE 考生的英文口試模擬練習平台。平台完整模擬了 DSE Paper 4 的考試流程：

1. **準備階段 (Preparation)** — 10 分鐘閱讀題目、整理思路
2. **小組討論 (Group Discussion)** — 8 分鐘 Part A 小組討論
3. **個人回應 (Individual Response)** — Part B 每人 1 分鐘回答考官問題
4. **結果公佈 (Results)** — 查看 Marker 評分與評語
5. **自由討論 (Free Discussion)** — 無時間限制的自由交流

平台收錄了 **2012–2025 年共 228 份** DSE Speaking 歷屆試題，包含完整的 Part A 文章、討論問題和 Part B 題目。

---

## 核心功能

### 多角色系統

| 角色 | 人數上限 | 攝像頭 | 麥克風 | 能力 |
|------|---------|--------|--------|------|
| **Candidate（考生）** | 4 人 | ✅ | ✅ | 參與討論、回答問題 |
| **Marker（考官）** | 1 人 | ❌ | ✅（Part B） | 選題、評分、寫評語 |
| **Spectator（觀眾）** | 不限 | ❌ | ❌ | 旁聽觀看 |

### 實時音視頻

- 基於 **LiveKit** (WebRTC) 的低延遲音視頻通話
- 入會前設備預覽（類似騰訊會議的 Pre-join 設定）
- 角色自適應的媒體權限控制
- 全屏畫廊視圖 + 浮動控制欄
- 活躍發言者高亮
- 移動端/桌面端自適應佈局

### 考試流程模擬

- **跳過投票**：全員投票一致可跳過當前階段
- **麥克風就緒檢測**：討論開始前自動檢測所有人麥克風狀態
- **3-2-1 倒計時**：討論和個人回應開始前的倒計時動畫
- **Marker 選題**：考官為每位考生選擇 Part B 問題
- **DSE 四維評分**：Pronunciation & Delivery、Communication Strategies、Vocabulary & Language Patterns、Ideas & Organisation（每項 1-7 分）

### 房間管理

- 創建/加入練習房間
- 實時成員狀態同步
- 準備就緒投票機制
- 無 Marker 時的繼續投票
- 房間自動結束（所有人離開時觸發）

### 國際化

- 支持 **English** 和 **繁體中文** 雙語切換
- 基於 React Context 的 i18n 方案

---

## 技術架構

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  Next.js 15 (App Router) + React 19 + TypeScript        │
│  Tailwind CSS v4 + shadcn/ui (Radix UI)                 │
│  LiveKit Components React (WebRTC)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Supabase    │ │ LiveKit  │ │   Vercel     │
│  ──────────  │ │ Cloud    │ │   ────────   │
│  PostgreSQL  │ │ ──────── │ │   Hosting    │
│  Auth        │ │  SFU     │ │   Edge       │
│  Realtime    │ │  WebRTC  │ │   Functions  │
│  Storage     │ │  Rooms   │ │              │
└──────────────┘ └──────────┘ └──────────────┘
```

### 前端技術棧

| 技術 | 用途 |
|------|------|
| **Next.js 15** (App Router) | 全棧 React 框架，SSR/SSG + API Routes |
| **React 19** | UI 渲染，React Compiler 優化 |
| **TypeScript 5** | 類型安全 |
| **Tailwind CSS v4** | 原子化 CSS 樣式 |
| **shadcn/ui** (New York) | 基於 Radix UI 的組件庫 |
| **Lucide React** | 圖標庫 |
| **Sonner** | Toast 通知 |
| **date-fns** | 日期處理 |

### 後端 & 基礎設施

| 技術 | 用途 |
|------|------|
| **Supabase** | BaaS — PostgreSQL 數據庫 + 認證 + 實時訂閱 + 文件存儲 |
| **LiveKit Cloud** | WebRTC SFU — 低延遲音視頻通話 |
| **Vercel** | 前端部署 + Edge Functions |

### 實時通信架構

```
用戶操作 → Supabase Realtime (PostgreSQL Changes)
         → 所有客戶端收到更新 → React 狀態同步

音視頻流 → LiveKit SFU Server
         → 根據角色權限分發音視頻軌道
```

- **房間狀態同步**：通過 Supabase Realtime 監聽 `rooms` 和 `room_members` 表的變更
- **音視頻**：通過 LiveKit 的 SFU 架構，根據角色動態控制 `canPublish` / `canSubscribe` 權限
- **Token 生成**：服務端 API Route (`/api/livekit/token`) 驗證用戶身份後簽發 JWT

---

## 數據庫設計

### ER 關係圖

```
profiles ──────────┐
  │                │
  │ 1:N            │ 1:N
  ▼                ▼
room_members ◄── rooms
  │                │
  │                │ 1:N
  │                ▼
  │          pastpaper_papers
  │
  │ N:1
  ▼
marker_scores
```

### 核心表結構

#### `rooms` — 練習房間

| 字段 | 類型 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵 |
| `name` | text | 房間名稱 |
| `host_id` | uuid → profiles | 房主 |
| `paper_id` | uuid → pastpaper_papers | 選用的試題 |
| `status` | enum | `waiting` → `preparing` → `discussing` → `individual` → `results` → `free_discussion` → `finished` |
| `max_members` | int | 最大人數（默認 4） |
| `current_phase_end_at` | timestamptz | 當前階段結束時間 |
| `current_speaker_index` | int | Part B 當前發言者索引 |
| `ready_votes` | text[] | 準備就緒的用戶 ID 列表 |
| `skip_votes` | text[] | 投票跳過的用戶 ID 列表 |
| `marker_questions` | jsonb | Marker 為每位考生選擇的題目索引 |
| `part_b_subphase` | text | Part B 子階段：`selecting` / `countdown` / `answering` |
| `part_b_countdown_end_at` | timestamptz | Part B 倒計時結束時間 |

#### `room_members` — 房間成員

| 字段 | 類型 | 說明 |
|------|------|------|
| `id` | uuid | 主鍵 |
| `room_id` | uuid → rooms | 所屬房間 |
| `user_id` | uuid → profiles | 用戶 |
| `role` | text | `participant` / `marker` / `spectator` |
| `speaking_order` | int | Part B 發言順序 |

#### `pastpaper_papers` — 歷屆試題（228 份）

| 字段 | 類型 | 說明 |
|------|------|------|
| `year` | int | 年份（2012–2025） |
| `paper_number` | text | 試卷編號 |
| `topic` | text | 主題 |
| `part_a_title` | text | Part A 標題 |
| `part_a_article` | text[] | Part A 閱讀材料（段落數組） |
| `part_a_discussion_points` | text[] | Part A 討論問題 |
| `part_b_questions` | jsonb | Part B 題目（含難度標記） |
| `page_images` | text[] | 試卷掃描圖 URL |

#### `marker_scores` — 考官評分

| 字段 | 類型 | 說明 |
|------|------|------|
| `marker_id` | uuid → profiles | 評分者 |
| `candidate_id` | uuid → profiles | 被評者 |
| `pronunciation_delivery` | int | 語音與表達（1-7） |
| `communication_strategies` | int | 溝通策略（1-7） |
| `vocabulary_language` | int | 詞彙與語言（1-7） |
| `ideas_organisation` | int | 觀點與組織（1-7） |
| `comment` | text | 文字評語 |

---

## 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | 首頁 | Landing page，功能介紹 |
| `/login` | 登入 | Email / Google OAuth 登入 |
| `/register` | 註冊 | Email 註冊 + 驗證引導 |
| `/rooms` | 房間列表 | 瀏覽、搜索、加入房間 |
| `/rooms/create` | 創建房間 | 選擇試題、設定房間 |
| `/rooms/[id]` | 等候室 | 角色選擇、準備就緒、成員管理 |
| `/rooms/[id]/session` | 練習會話 | 完整考試流程（準備→討論→個人回應→結果） |
| `/api/livekit/token` | API | LiveKit Token 簽發 |
| `/auth/callback` | Auth | OAuth 回調處理 |

---

## 目錄結構

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認證頁面組
│   │   ├── login/page.tsx        # 登入頁
│   │   └── register/page.tsx     # 註冊頁
│   ├── api/
│   │   └── livekit/token/route.ts # LiveKit Token API
│   ├── auth/callback/route.ts    # OAuth 回調
│   ├── rooms/
│   │   ├── page.tsx              # 房間列表
│   │   ├── create/page.tsx       # 創建房間
│   │   └── [id]/
│   │       ├── page.tsx          # 等候室
│   │       └── session/page.tsx  # 練習會話（核心頁面）
│   ├── layout.tsx                # 根佈局
│   ├── page.tsx                  # 首頁
│   └── globals.css               # 全局樣式 + LiveKit 覆蓋
│
├── components/
│   ├── auth/auth-form.tsx        # 認證表單（含郵箱驗證引導）
│   ├── layout/navbar.tsx         # 導航欄
│   ├── livekit/
│   │   ├── livekit-session.tsx   # LiveKit 音視頻核心組件
│   │   └── media-controls.tsx    # 麥克風/攝像頭控制
│   ├── providers/
│   │   ├── app-providers.tsx     # 全局 Provider 組合
│   │   └── i18n-provider.tsx     # 國際化 Context
│   ├── room/room-card.tsx        # 房間卡片
│   ├── session/
│   │   ├── marker-question-selector.tsx  # Marker 選題面板
│   │   ├── marker-scoring-panel.tsx      # Marker 評分面板
│   │   ├── phase-indicator.tsx           # 階段指示器
│   │   └── timer-display.tsx             # 倒計時顯示
│   └── ui/                       # shadcn/ui 組件（15 個）
│
├── hooks/
│   ├── use-countdown.ts          # 倒計時 Hook
│   └── use-user.ts               # 用戶認證 Hook
│
└── lib/
    ├── i18n/messages.ts          # 國際化文案（en + zh-Hant）
    ├── supabase/
    │   ├── client.ts             # 瀏覽器端 Supabase Client
    │   ├── server.ts             # 服務端 Supabase Client
    │   ├── middleware.ts         # Auth 中間件
    │   └── types.ts              # 數據庫 TypeScript 類型
    └── utils.ts                  # 工具函數（cn）
```

---

## 本地開發

### 前置要求

- Node.js 18+
- npm / pnpm / yarn
- Supabase 項目（需要 PostgreSQL + Auth + Realtime）
- LiveKit Cloud 帳號（或自建 LiveKit Server）

### 安裝 & 啟動

```bash
# 克隆項目
git clone https://github.com/Randy-sin/dsespeakingweb.git
cd dsespeakingweb

# 安裝依賴
npm install

# 配置環境變量（見下方）
cp .env.example .env.local

# 啟動開發服務器
npm run dev
```

訪問 http://localhost:3000

---

## 環境變量

在 `.env.local` 中配置：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# LiveKit
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

---

## 部署

項目部署在 **Vercel** 上，推送到 `main` 分支自動觸發部署。

```bash
# 手動部署
vercel --prod
```

需要在 Vercel 項目設置中配置上述環境變量。

同時需要在 **Supabase** 和 **Google Cloud Console**（如使用 Google OAuth）中配置正確的回調 URL。

---

## 許可證

本項目僅供學習和練習使用。DSE 歷屆試題版權歸香港考試及評核局 (HKEAA) 所有。
