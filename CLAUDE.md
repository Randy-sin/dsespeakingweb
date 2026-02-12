# CLAUDE.md

> Claude Code 专用项目配置文件，每次对话自动加载。

## 项目概述

DSE Speaking Practice - 香港 DSE 英文口试 (Paper 4) 在线模拟练习平台。

**考试流程**: Preparation (10min) → Group Discussion (8min) → Individual Response (1min/人) → Results → Free Discussion

## 技术栈

- **框架**: Next.js 15 (App Router) + React 19 + TypeScript
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **音视频**: LiveKit (WebRTC)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **部署**: Vercel

## 常用命令

```bash
pnpm dev          # 启动开发服务器 (localhost:3000)
pnpm build        # 生产构建
pnpm lint         # ESLint 检查
pnpm typecheck    # TypeScript 类型检查
```

## 目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── rooms/[id]/         # 房间等候室
│   │   └── session/        # 考试会话页面
│   ├── papers/             # 历年真题浏览
│   └── api/                # API 路由 (LiveKit token 等)
├── components/
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── room/               # 房间相关组件
│   └── session/            # 考试会话组件
├── hooks/                  # 自定义 React Hooks
├── lib/
│   ├── supabase/           # Supabase 客户端和类型
│   └── i18n/               # 国际化 (EN/繁中)
└── types/                  # TypeScript 类型定义
```

## 数据库表 (Supabase)

| 表名 | 用途 |
|------|------|
| `profiles` | 用户资料 (display_name, speaking_level) |
| `rooms` | 房间状态、流程阶段、倒计时 |
| `room_members` | 房间成员、角色、心跳时间 |
| `pastpaper_papers` | 267份历年真题 (2012-2025) |
| `marker_scores` | 四维评分 (每项0-7分) |

**房间状态流转**: `waiting` → `preparation` → `discussion` → `individual_response` → `results` → `free_discussion` → `ended`

**角色**: `participant` (考生, 最多4人) | `marker` (考官, 1人) | `spectator` (观众)

## 实时同步

- 使用 Supabase Realtime 订阅 `rooms` 和 `room_members` 表变更
- `useHeartbeat` hook 每30秒发送心跳，pg_cron 清理超时成员
- LiveKit 处理音视频流

## 代码规范

- 组件使用函数式 + Hooks
- 状态管理优先使用 React Context
- 数据库操作通过 Supabase Client
- 类型定义在 `src/lib/supabase/types.ts` (可用 MCP 生成)
- 中英双语文案在 `src/lib/i18n/`

## 注意事项

- LiveKit token 通过 `/api/livekit/token` 获取
- 房间流程由 host 或 marker 控制
- Part B 阶段有子流程: `question_display` → `countdown` → `answering`
- 所有表已启用 RLS，注意权限策略
