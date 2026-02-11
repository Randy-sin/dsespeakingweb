# DSE Speaking Practice Platform

在线组队练习 DSE English Paper 4 (Speaking) 的平台。支持 4 人小组讨论、历年真题、自动计时、实时语音视频。

## 功能特色

- **在线组队** - 创建或加入练习房间，等待 3-4 人即可开始
- **真题题库** - 228 份 DSE Speaking 历年真题，覆盖 2012-2025 年
- **完整考试流程** - 准备(10min) → 小组讨论(8min) → 个人回应(1min/人)
- **实时音视频** - LiveKit WebRTC 驱动的高质量语音视频通话
- **实时同步** - Supabase Realtime 实时同步房间状态和成员变化

## 技术栈

- **框架**: Next.js 15 (App Router) + TypeScript
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库 & Auth**: Supabase (PostgreSQL + Auth + Realtime)
- **语音视频**: LiveKit Cloud + @livekit/components-react
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 并填入你的密钥：

```bash
cp .env.local.example .env.local
```

需要配置：
- **Supabase**: 创建项目后获取 URL 和 Anon Key
- **LiveKit**: 注册 [LiveKit Cloud](https://livekit.io/) 获取 API Key 和 Secret

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 Key |
| `LIVEKIT_API_KEY` | LiveKit API Key |
| `LIVEKIT_API_SECRET` | LiveKit API Secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL (wss://...) |

## 数据库

项目使用 Supabase PostgreSQL，主要表：

- `profiles` - 用户资料
- `rooms` - 练习房间
- `room_members` - 房间成员
- `pastpaper_papers` - DSE 真题题库（已有 228 份数据）

## 部署到 Vercel

1. Push 代码到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量
4. 部署

## DSE Speaking 考试规则

- **Paper 4** 占总分 10%，约 20 分钟
- **Part A**: 小组讨论 - 阅读文章 + 3 个讨论问题 (准备 10min, 讨论 8min)
- **Part B**: 个人回应 - 每人回答 1 个跟进问题 (每人 1min)
- **评分**: 发音表达 25% + 沟通策略 25% + 词汇语言 25% + 观点组织 25%
