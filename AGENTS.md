# AGENTS.md — 今日热搜（mini-hot-hub）

> 本文件是 AI 开发代理的工作约束。动手写代码前必读，所有改动须符合这里的决策。
> 配套文档：PRD（今日热搜PRD.md）、技术设计（今日热搜-技术设计.md）。文档冲突时以本文件为准。

## 项目性质
- 多平台热搜聚合网站，首页卡片网格展示微博 / 知乎 / B 站热榜。
- **全栈学习 / Vibe Coding 练手项目，非商用**。页脚需保留学习项目说明、数据来源、非商用声明。
- 访客打开即看，无需登录。MVP 不做账号 / 用户体系。

## 技术栈（固定，不要替换）
- 前端：React + TypeScript + Vite + CSS（可用 CSS Modules，不强制引入 UI 库）。
- 后端：Node.js + Express + **TypeScript**（全项目统一 TS，禁止 .js 与 .ts 混用）。
- 数据：fetch 各平台公开 JSON 接口解析。
- 缓存：后端内存 Map。

## 架构与部署（核心决策，不可违背）
- **前端部署 Vercel，后端部署 Railway，两者分离。**
- 后端必须是**长驻进程**（Railway 特性），内存缓存才成立。
  - ❌ 不要把后端放 Vercel / 任何 Serverless 平台——无状态 + 冷启动会让内存缓存失效。
- 前后端不同域名 = **跨域**，后端**必须配置 CORS**，白名单含前端 Vercel 域名。漏配会导致前端拿不到任何数据。

## 目录结构
```
mini-hot-hub/
├── client/                 # Vite + React
│   └── src/{components,api,types,mock}/
├── server/
│   └── src/{routes,services,utils}/
├── shared/                 # 前后端共享类型（HotItem / HotPlatform）
└── AGENTS.md
```
- 数据模型定义在 `shared/`，前后端共用，禁止两边各写一份。

## 数据契约
- 接口：`GET /api/hot/:source`（source = weibo | zhihu | bilibili）；可选 `GET /api/hot` 返回全部。
- 响应类型 `HotPlatform`：`{ source, sourceName, listName, updatedAt(ISO8601), items: HotItem[], error?, message? }`
- `HotItem`：`{ rank, title, heat?, url }`

## 数据源规则
- 取数优先级与稳定性：**B 站（官方公开 API，最稳）> 知乎（热榜 JSON，补 UA/referer）> 微博（最易失败）**。
- 微博在 Railway 海外 IP 下常取不到干净 JSON：补请求头重试 → 仍失败则该卡片走 error 降级，不影响其他平台。
- ❌ 不用微博 OAuth；❌ 不用 HTML 爬虫（仅作最末位兜底，且需说明）。

## 缓存与异常
- 每平台独立缓存键，TTL 300~600 秒；响应带 `updatedAt`，前端显示「更新于 x 分钟前」。
- 上游失败：有旧缓存优先返回旧数据 + 标记；无缓存返回 error 态。
- **单平台失败必须隔离**，绝不阻塞整页或拖垮其他卡片。

## 环境变量
- 开发：Vite 代理 `/api` → `http://localhost:3001`（前后端同源，无跨域）。
- 生产：前端 `VITE_API_BASE` 指向 Railway 后端域名；后端读 `PORT`（Railway 注入）、`ALLOWED_ORIGINS`（CORS 白名单）。

## 常用命令（搭好后补全实际命令）
- 前端：`cd client && npm run dev` / `npm run build`
- 后端：`cd server && npm run dev` / `npm run build && npm start`

## MVP 范围外（不要主动加）
- 账号 / 登录、站内搜索、历史榜、暗色模式、分类 Tab、抖音/百度等更多平台。
- 这些是「后续可做」，MVP 阶段不实现，除非明确要求。

## 给 AI 的工作方式
- 先跑通一条最稳链路（B 站 service → cache → 一张 HotCard），再复制到知乎、微博。
- 改动保持小而可验证；新增平台只在 `server/src/services/` 加文件 + 注册路由，不动既有结构。
- 不确定的取数细节先用 `client/src/mock/` 假数据让前端跑起来，再接真实接口。
