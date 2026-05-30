import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:thepaper";
const ttlSeconds = 420;
const endpoint = "https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar";

interface ThepaperHotItem {
  contId?: string;
  link?: string;
  name?: string;
  interactionNum?: string;
  praiseTimes?: string;
  pubTime?: string;
}

interface ThepaperResponse {
  resultCode: number;
  data?: {
    hotNews?: ThepaperHotItem[];
  };
}

export async function fetchThepaperHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        accept: "application/json",
        referer: "https://www.thepaper.cn/",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
    });

    if (!response.ok) {
      throw new Error(`The Paper responded ${response.status}`);
    }

    const json = (await response.json()) as ThepaperResponse;

    if (json.resultCode !== 1 || !json.data?.hotNews) {
      throw new Error("The Paper response is invalid");
    }

    const items: HotItem[] = json.data.hotNews.slice(0, 12).map((item, index) => ({
      rank: index + 1,
      title: item.name ?? "未命名新闻",
      heat: formatHeat(item),
      url: toThepaperUrl(item),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "thepaper",
        ...sourceNames.thepaper,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "澎湃新闻接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function formatHeat(item: ThepaperHotItem): string | undefined {
  if (item.interactionNum) {
    return `${item.interactionNum} 互动`;
  }

  if (item.praiseTimes) {
    return `${item.praiseTimes} 点赞`;
  }

  return item.pubTime;
}

function toThepaperUrl(item: ThepaperHotItem): string {
  if (item.link) {
    return item.link;
  }

  if (item.contId) {
    return `https://www.thepaper.cn/newsDetail_forward_${item.contId}`;
  }

  return "https://www.thepaper.cn/";
}
