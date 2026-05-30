import type { HotSource } from "../../../shared/src/types";

export const sourceNames: Record<HotSource, { sourceName: string; listName: string }> = {
  bilibili: { sourceName: "B 站", listName: "热门视频" },
  zhihu: { sourceName: "知乎", listName: "热榜" },
  weibo: { sourceName: "微博", listName: "热搜榜" },
  thepaper: { sourceName: "澎湃新闻", listName: "新闻热榜" },
  toutiao: { sourceName: "今日头条", listName: "头条热榜" },
  cctv: { sourceName: "央视新闻", listName: "最新新闻" },
  "36kr": { sourceName: "36氪", listName: "人气榜" },
  qbitai: { sourceName: "量子位", listName: "AI 资讯" },
};
