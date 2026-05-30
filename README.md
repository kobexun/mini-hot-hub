# 今日热搜

微博、知乎、B 站、澎湃新闻、今日头条、央视新闻、36氪、量子位热榜聚合练手项目。前端使用 React + TypeScript + Vite，后端使用 Node.js + Express + TypeScript，数据模型统一来自 `shared/`。

## 本地开发

```bash
npm install
npm run dev:server
npm run dev:client
```

前端开发服务默认通过 Vite 代理把 `/api` 转发到 `http://localhost:3001`。

## 生产环境变量

前端：

```bash
VITE_API_BASE=https://your-railway-service.example
```

后端：

```bash
PORT=3001
ALLOWED_ORIGINS=https://your-vercel-site.example
```

多个前端域名可用英文逗号分隔。

## 部署

### 后端 Railway

1. 在 Railway 新建项目并连接本仓库。
2. Root Directory 保持仓库根目录，不要只选择 `server/`，因为后端构建需要读取 `shared/`。
3. Railway 会读取 `railway.json`：
   - Build Command: `npm install && npm run build -w server`
   - Start Command: `npm run start -w server`
4. 配置环境变量：

```bash
ALLOWED_ORIGINS=https://your-vercel-site.example
```

`PORT` 由 Railway 自动注入，本地开发才需要手动使用 `3001`。

### 前端 Vercel

1. 在 Vercel 新建项目并连接本仓库。
2. Root Directory 保持仓库根目录，不要只选择 `client/`，因为前端构建需要读取 `shared/`。
3. Vercel 会读取 `vercel.json`：
   - Build Command: `npm run build -w client`
   - Output Directory: `client/dist`
4. 配置环境变量：

```bash
VITE_API_BASE=https://your-railway-service.example
```

部署后把 Vercel 域名填回 Railway 的 `ALLOWED_ORIGINS`。

## 接口说明

- `GET /health`：后端健康检查。
- `GET /api/hot`：返回全部来源，单个来源失败会隔离为该卡片 error 状态。
- `GET /api/hot/:source`：返回单个来源，`source` 可为 `bilibili`、`zhihu`、`weibo`、`thepaper`、`toutiao`、`cctv`、`36kr`、`qbitai`。

上游公开接口可能因为访问频率、地域或临时风控失败。后端会做内存缓存、超时控制和单来源隔离，避免拖垮整页。

## 构建

```bash
npm run build
npm run start -w server
```
