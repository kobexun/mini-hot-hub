import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:36kr";
const ttlSeconds = 420;
const endpoint = "https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot";

interface KrHotItem {
  itemId?: string | number;
  route?: string;
  templateMaterial?: {
    widgetTitle?: string;
    statFormat?: string;
    statRead?: number;
  };
}

interface KrResponse {
  code: number;
  data?: {
    hotRankList?: KrHotItem[];
  };
}

export async function fetch36KrHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        referer: "https://www.36kr.com/hot-list/catalog",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
      body: JSON.stringify({
        partner_id: "web",
        param: {
          siteId: 1,
          platformId: 2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`36Kr responded ${response.status}`);
    }

    const json = (await response.json()) as KrResponse;

    if (json.code !== 0 || !json.data?.hotRankList) {
      throw new Error("36Kr response is invalid");
    }

    const items: HotItem[] = json.data.hotRankList.slice(0, 12).map((item, index) => ({
      rank: index + 1,
      title: item.templateMaterial?.widgetTitle ?? "未命名文章",
      heat: item.templateMaterial?.statFormat ?? formatReadCount(item.templateMaterial?.statRead),
      url: to36KrUrl(item),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "36kr",
        ...sourceNames["36kr"],
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "36氪接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function formatReadCount(readCount?: number): string | undefined {
  if (typeof readCount !== "number") {
    return undefined;
  }

  if (readCount >= 10000) {
    return `${(readCount / 10000).toFixed(1)} 万阅读`;
  }

  return `${readCount} 阅读`;
}

function to36KrUrl(item: KrHotItem): string {
  if (item.itemId) {
    return `https://www.36kr.com/p/${item.itemId}`;
  }

  if (item.route) {
    return `https://www.36kr.com/${item.route}`;
  }

  return "https://www.36kr.com/hot-list/catalog";
}
