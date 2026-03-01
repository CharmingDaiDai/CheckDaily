# 打卡 · 习惯追踪

个人习惯打卡追踪 PWA 应用，支持每日打卡、数据统计与可视化。

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 路由 | TanStack Router（文件路由） |
| 数据请求 | TanStack Query v5 |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS v4 |
| UI 组件 | Radix UI + shadcn/ui |
| 图表 | Recharts + Nivo Calendar |
| 后端 / 数据库 | Supabase（PostgreSQL + Auth + RLS） |
| PWA | vite-plugin-pwa（Workbox） |

## 功能

- **今日打卡** — 首页展示当日所有习惯，一键打卡并实时更新进度条
- **近7天趋势** — 首页嵌入柱状图，直观呈现最近一周的打卡频次
- **项目管理** — 新建、编辑、归档习惯项目，支持自定义颜色与 Emoji 图标
- **统计分析** — 日历热力图 + 折线图，查看任意时间范围的打卡记录
- **用户认证** — Supabase Auth 邮箱登录，Row Level Security 确保数据隔离
- **PWA 支持** — 可安装到桌面/手机主屏，离线可访问缓存资源

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd daka-app
npm install
```

### 2. 配置 Supabase

在 [Supabase](https://supabase.com) 控制台创建项目，然后在项目根目录创建 `.env.local`：

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. 初始化数据库

在 Supabase 控制台 → **SQL Editor** 中执行 [`supabase-schema.sql`](supabase-schema.sql)，该脚本会创建：

- `habits` 表 — 存储习惯项目
- `check_ins` 表 — 存储每次打卡记录
- Row Level Security 策略 — 用户只能访问自己的数据

### 4. 启动开发服务器

```bash
npm run dev
```

## 可用命令

```bash
npm run dev      # 启动本地开发服务器（HMR）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建产物
npm run lint     # ESLint 代码检查
```

## 项目结构

```
src/
├── routes/          # 文件路由（TanStack Router 自动生成路由树）
│   ├── index.tsx    # 今日打卡首页
│   ├── habits.tsx   # 习惯项目管理
│   ├── stats/       # 统计分析页
│   ├── profile.tsx  # 用户设置
│   └── login.tsx    # 登录页
├── components/
│   ├── habits/      # 习惯卡片、表单组件
│   ├── charts/      # 柱状图、折线图、日历热力图
│   ├── layout/      # 底部导航栏等布局组件
│   └── ui/          # 基础 UI 组件（Button、Dialog 等）
├── hooks/           # useHabits、useCheckIns、useAuth
├── store/           # Zustand 状态（authStore）
├── lib/             # 工具函数、Supabase 客户端
└── types/           # TypeScript 类型定义
```

## 数据库设计

```sql
habits      (id, user_id, name, color, icon, archived, created_at)
check_ins   (id, habit_id, user_id, checked_at, note, created_at)
```

两张表均启用 RLS，所有读写操作严格限制为当前认证用户。
