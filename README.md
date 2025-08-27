# Secondhand platform design

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/learnerhouses-projects/v0-secondhand-platform-design)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/PTJ7ZGBXoXg)

## 项目概览

一个基于 Next.js 15 + React 19 + Tailwind CSS 4 + Supabase 的二手交易平台示例，包含买家市场、卖家中心、消息系统与管理后台。

### 主要模块

- 市场（`/marketplace`）：商品列表、分类筛选、搜索、排序、详情页（含浏览量统计、相关商品）。
- 消息（`/messages`）：对话列表、对话详情、发送新消息。
- 卖家中心（`/seller`）：商家仪表盘、商品管理、发布新商品。
- 管理后台（`/admin`）：平台数据总览、用户管理、商品审核。
- 认证（`/auth/*`）：登录、注册、回调、邮件验证。
- 个人页（`/profile`）与设置页（`/settings`）。
- 结算页（`/checkout`）：根据商品下单，写入 `orders` 表。

### 关键技术

- Next.js App Router 与中间件会话同步（`/middleware.ts`, `lib/supabase/*`）
- Supabase SSR/客户端 SDK、RLS 策略与 SQL 脚本（`/scripts/*.sql`）
- Tailwind CSS 4 与 Shadcn UI 组件（`components/ui`）


## 启动方式

1. 环境变量（.env.local）：
```
NEXT_PUBLIC_SUPABASE_URL=... 
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
可选：
```
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

2. 安装依赖并启动：
```
pnpm install
pnpm dev
```
或使用 npm/yarn 等等。

3. 初始化数据库（Supabase SQL Editor 依次执行）：
```
scripts/001_create_users_profiles.sql
scripts/002_create_categories.sql
scripts/003_create_products.sql
scripts/004_create_messages.sql
scripts/005_create_orders.sql
scripts/006_create_triggers.sql
scripts/007_fix_rls_policies.sql
scripts/008_insert_test_data.sql
scripts/009_insert_demo_products.sql
```

4. 访问：
- 未登录可访问：`/`, `/marketplace`, `/auth/*`
- 登录后访问：`/messages`, `/seller`, `/admin` 等受保护页面

## 中间件与权限

- 中间件在 `lib/supabase/middleware.ts`，并在 `middleware.ts` 中匹配路由。已放行公共页面（主页、auth、marketplace）。
- 其余页面需登录，访问时会被重定向到 `/auth/login`。

## 构建命令

```
pnpm build
pnpm start
```

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/PTJ7ZGBXoXg](https://v0.app/chat/projects/PTJ7ZGBXoXg)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository