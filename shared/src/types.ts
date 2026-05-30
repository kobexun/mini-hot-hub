export type HotSource = "weibo" | "zhihu" | "bilibili" | "thepaper" | "toutiao" | "cctv" | "36kr" | "qbitai";

export interface HotItem {
  rank: number;
  title: string;
  heat?: string;
  url: string;
}

export interface HotPlatform {
  source: HotSource;
  sourceName: string;
  listName: string;
  updatedAt: string;
  items: HotItem[];
  error?: boolean;
  message?: string;
}
