# DSE Speaking

面向香港中学文凭考试（HKDSE）英语 Paper 4 的教学与练习网站。产品不是线上会议室；学生会先学习答题方法，再完成 Individual Response 或 Group Discussion 练习，并根据自己的逐字稿取得有证据的 AI 训练反馈。

线上网站：[dsespeaking.com](https://www.dsespeaking.com)

## 主要功能

- 四步 onboarding：按目标、薄弱环节和时间生成首周学习建议。
- Group Discussion 教学：回应同学、扩展观点、邀请发言、处理分歧和总结。
- Individual Response 教学：选择、解释、比较、预测和个人经验题型。
- 真题练习：从历届题目直接进入 Part A 或 Part B 学习流程。
- 录音与逐字稿：浏览器本地录音，学生确认后才上传转写。
- AI 教练：只根据逐字稿中的可见证据给出四维训练量表；不是 HKEAA 官方评分，也不会根据文字推断发音或眼神等表现。
- AI 讨论伙伴：针对学生刚才的一个具体观点回应，并加入新理由、例子、限制或问题。
- 私人学习记录：登录后将课程进度、练习逐字稿、反馈和讨论发言保存至 Supabase。

## 技术架构

- Next.js App Router、React、TypeScript、Tailwind CSS
- Supabase Auth、PostgreSQL、Row Level Security 和 Storage
- 豆包实时模型：结构化反馈和讨论伙伴
- 火山引擎录音文件识别：英语逐字稿
- Vercel 部署，Cloudflare 提供 DNS、DDoS 和机器人防护

## 安全边界

- 所有 AI API 要求已登录的非匿名账号、同源请求和限定 Content-Type／请求大小。
- AI 请求按用户和用途执行数据库原子限流；Cloudflare 另有边缘突发请求规则。
- 学生输入以不可信 JSON 传给模型，模型输出在写入数据库前经过长度、结构和敏感内容校验。
- 练习数据受用户级 RLS 隔离；录音 storage bucket 为私有。
- API 响应禁用缓存及搜索引擎索引；站点设置 CSP、点击劫持、MIME 嗅探、来源和浏览器权限策略。
- 密钥只放在服务端环境变量，不进入客户端 bundle 或 Git。

## 本地开发

要求 Node.js 20 或更新版本。

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

常用检查：

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## 环境变量

在 `.env.local` 或部署平台中配置：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DOUBAO_APP_KEY=
DOUBAO_RESOURCE_ID=
DOUBAO_REALTIME_WS_URL=
DOUBAO_ASR_RESOURCE_ID=
DOUBAO_ASR_URL=
```

不要把实际值提交到 Git。AI 与 ASR 环境变量只应由服务端读取。

## 数据库

生产 schema 由 `supabase/migrations/` 管理。学习平台相关表包含 learner profile、lesson progress、practice sessions、practice turns 和私有 rate-limit windows。所有用户数据表必须保持 RLS 开启。

应用 migration 后，至少运行：

- 匿名和跨用户读写拒绝测试；
- 已登录用户自己的读写测试；
- Supabase Security Advisor；
- AI 限流允许、拒绝和窗口重置测试。

## 主要路由

- `/`：产品首页
- `/onboarding`：学习目标设置
- `/learn`：个人学习首页
- `/learn/group-discussion`：Group Discussion 课程
- `/learn/individual-response`：Individual Response 课程
- `/practice/group-discussion`：小组讨论练习
- `/practice/individual-response`：个人回应练习
- `/papers`：历届真题
- `/progress`：个人进度

旧 `/rooms` 入口只保留安全重定向，不再提供会议室功能。

## 部署与验收

部署由 GitHub `main` 分支触发 Vercel。一次完整发布必须分别确认：

1. 测试、TypeScript、ESLint 和 production build 通过；
2. Supabase migrations 已应用，Security Advisor 没有新增 schema 风险；
3. Vercel 部署成功且自定义域名指向新 commit；
4. 线上登录、AI 反馈、AI 讨论伙伴和数据持久化真实通过；
5. 安全响应头、匿名／跨域拒绝、robots、sitemap 和已移除调试路由真实通过。

详细需求、设计和任务状态见 [`specs/dse-speaking-learning-platform/`](./specs/dse-speaking-learning-platform/)。
