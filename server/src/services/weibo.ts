import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:weibo";
const ttlSeconds = 300;
const endpoint = "https://weibo.com/ajax/side/hotSearch";

interface WeiboHotItem {
  word?: string;
  note?: string;
  raw_hot?: number;
  scheme?: string;
}

interface WeiboHotResponse {
  data?: {
    realtime?: WeiboHotItem[];
  };
}

export async function fetchWeiboHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const json = await requestWeiboHot();
    const realtime = json.data?.realtime;

    if (!realtime) {
      throw new Error("Weibo response is invalid");
    }

    const items: HotItem[] = realtime
      .filter((item) => item.word)
      .slice(0, 12)
      .map((item, index) => ({
        rank: index + 1,
        title: item.word ?? "未命名热搜",
        heat: item.note ?? formatHot(item.raw_hot),
        url: item.scheme ?? `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word ?? "")}`,
      }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "weibo",
        ...sourceNames.weibo,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "微博接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

async function requestWeiboHot(): Promise<WeiboHotResponse> {
  const headers = {
    accept: "application/json, text/plain, */*",
    referer: "https://weibo.com/hot/search",
    "user-agent": "Mozilla/5.0 mini-hot-hub",
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchWithTimeout(endpoint, { headers });

    if (response.ok) {
      return (await response.json()) as WeiboHotResponse;
    }
  }

  throw new Error("Weibo responded with a non-OK status");
}

function formatHot(rawHot?: number): string | undefined {
  if (typeof rawHot !== "number") {
    return undefined;
  }

  if (rawHot >= 10000) {
    return `${Math.round(rawHot / 10000)} 万热度`;
  }

  return `${rawHot} 热度`;
}
