import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:bilibili";
const ttlSeconds = 420;
const endpoint = "https://api.bilibili.com/x/web-interface/popular?ps=30&pn=1";

interface BilibiliPopularItem {
  title?: string;
  short_link_v2?: string;
  bvid?: string;
  stat?: {
    view?: number;
  };
}

interface BilibiliPopularResponse {
  code: number;
  message?: string;
  data?: {
    list?: BilibiliPopularItem[];
  };
}

export async function fetchBilibiliHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        "user-agent": "mini-hot-hub/0.1",
        referer: "https://www.bilibili.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`Bilibili responded ${response.status}`);
    }

    const json = (await response.json()) as BilibiliPopularResponse;

    if (json.code !== 0 || !json.data?.list) {
      throw new Error(json.message ?? "Bilibili response is invalid");
    }

    const items: HotItem[] = json.data.list.slice(0, 12).map((item, index) => ({
      rank: index + 1,
      title: item.title ?? "未命名视频",
      heat: formatCount(item.stat?.view),
      url: item.short_link_v2 ?? (item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : "https://www.bilibili.com/v/popular/all"),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "bilibili",
        ...sourceNames.bilibili,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "B 站接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function formatCount(count?: number): string | undefined {
  if (typeof count !== "number") {
    return undefined;
  }

  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)} 万观看`;
  }

  return `${count} 观看`;
}
