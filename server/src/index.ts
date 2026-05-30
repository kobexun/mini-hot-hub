import cors from "cors";
import express from "express";
import { hotRouter } from "./routes/hot";

const app = express();
const port = Number(process.env.PORT ?? 3001);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);

app.get("/", (_request, response) => {
  response.json({
    name: "mini-hot-hub API",
    ok: true,
    endpoints: {
      health: "/health",
      allHot: "/api/hot",
      bilibili: "/api/hot/bilibili",
      zhihu: "/api/hot/zhihu",
      weibo: "/api/hot/weibo",
      thepaper: "/api/hot/thepaper",
      toutiao: "/api/hot/toutiao",
      cctv: "/api/hot/cctv",
      "36kr": "/api/hot/36kr",
      qbitai: "/api/hot/qbitai",
    },
  });
});

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/hot", hotRouter);

app.listen(port, () => {
  console.log(`mini-hot-hub server listening on ${port}`);
});
