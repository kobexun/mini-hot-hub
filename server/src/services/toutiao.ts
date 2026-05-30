import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:toutiao";
const ttlSeconds = 300;
const endpoint = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc";

interface ToutiaoHotItem {
  Title?: string;
  HotValue?: string;
  Url?: string;
  ClusterId?: string | number;
}

interface ToutiaoResponse {
  data?: ToutiaoHotItem[];
}

export async function fetchToutiaoHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        accept: "application/json",
        referer: "https://www.toutiao.com/",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
    });

    if (!response.ok) {
      throw new Error(`Toutiao responded ${response.status}`);
    }

    const json = (await response.json()) as ToutiaoResponse;

    if (!json.data) {
      throw new Error("Toutiao response is invalid");
    }

    const items: HotItem[] = json.data.slice(0, 12).map((item, index) => ({
      rank: index + 1,
      title: item.Title ?? "未命名新闻",
      heat: formatHotValue(item.HotValue),
      url: item.Url ?? toToutiaoUrl(item.ClusterId),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "toutiao",
        ...sourceNames.toutiao,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "今日头条接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function formatHotValue(value?: string): string | undefined {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (numericValue >= 10000) {
    return `${Math.round(numericValue / 10000)} 万热度`;
  }

  return `${numericValue} 热度`;
}

function toToutiaoUrl(clusterId?: string | number): string {
  if (!clusterId) {
    return "https://www.toutiao.com/";
  }

  return `https://www.toutiao.com/trending/${clusterId}/`;
}
