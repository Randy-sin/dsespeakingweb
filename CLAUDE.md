# CLAUDE.md

## 项目概述

DSE Speaking 是一个香港中学文凭考试 English Language Paper 4 教学与练习平台。产品不再提供会议室、真人组队或考官房间；核心闭环是「学习方法 → 开口练习 → 证据化反馈 → 下一步建议」。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/ui、Radix UI
- Supabase Auth、PostgreSQL、Private Storage
- 豆包 realtime adapter（只在服务端读取凭证）

## 常用命令

```bash
npm run dev
npx tsc --noEmit
npm run lint
npm run build
```

## 主要目录

```text
src/app/
  onboarding/                         # 无表单的首次开口练习
  learn/                              # 学习首页、GD/IR 课程与短练习
  practice/                           # GD 引导练习、IR 计时与录音
  papers/                             # 真题库与练习入口
  progress/                           # 本地及同步进度
  api/ai/                             # 登录保护的学习 AI 接口
src/components/learning/              # 课程地图、课程页、同步
src/features/                         # onboarding、学习首页、录音、练习 session
src/lib/learning/                     # 教材、类型、本地状态与推荐逻辑
supabase/migrations/                  # 学习表、RLS 与私人录音 bucket
specs/dse-speaking-learning-platform/ # 需求、设计与实施任务
```

## 产品与数据规则

- 访客可以完成 onboarding、课程和录音；本地状态使用版本化 localStorage。
- 所有入口与短练习都以声音优先：题目后直接显示录音操作，不得把问卷、笔记或 transcript 输入设为开口前置条件。
- 文字只用于录音后的逐字稿校对，或在浏览器明确无法使用麦克风后作为后备路径。
- 登录后合并 learner profile 与 lesson progress，不可覆盖较新的完成记录。
- 录音默认只留在浏览器；用户明确勾选后才上传至私人 bucket。
- AI 回馈必须绑定学生 transcript，不得显示为 HKEAA 官方分数。
- 转写或 AI 服务失败时，必须保留浏览器中的录音与已存在的 transcript。
- 不得重新引入 room、marker、spectator、LiveKit 或 WebRTC 主流程。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
