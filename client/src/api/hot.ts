import type { HotPlatform, HotSource } from "../../../shared/src/types";

const apiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";

export const hotSources: HotSource[] = ["bilibili", "zhihu", "weibo", "thepaper", "toutiao", "cctv", "36kr", "qbitai"];

export async function fetchHotPlatforms(): Promise<HotPlatform[]> {
  const response = await fetch(`${apiBase}/api/hot`);

  if (!response.ok) {
    throw new Error(`服务返回 ${response.status}`);
  }

  return (await response.json()) as HotPlatform[];
}

export async function fetchHotPlatform(source: HotSource): Promise<HotPlatform> {
  const response = await fetch(`${apiBase}/api/hot/${source}`);

  if (!response.ok) {
    throw new Error(`服务返回 ${response.status}`);
  }

  return (await response.json()) as HotPlatform;
}
