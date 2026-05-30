import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:zhihu";
const ttlSeconds = 360;
const endpoint = "https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=30&desktop=true";

interface ZhihuHotEntry {
  target?: {
    title?: string;
    url?: string;
    title_area?: {
      text?: string;
    };
    excerpt_area?: {
      text?: string;
    };
    metrics_area?: {
      text?: string;
    };
    link?: {
      url?: string;
    };
  };
  detail_text?: string;
}

interface ZhihuHotResponse {
  data?: ZhihuHotEntry[];
}

export async function fetchZhihuHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        accept: "application/json",
        referer: "https://www.zhihu.com/hot",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
    });

    if (!response.ok) {
      throw new Error(`Zhihu responded ${response.status}`);
    }

    const json = (await response.json()) as ZhihuHotResponse;

    if (!json.data) {
      throw new Error("Zhihu response is invalid");
    }

    const items: HotItem[] = json.data.slice(0, 12).map((entry, index) => ({
      rank: index + 1,
      title: entry.target?.title_area?.text ?? entry.target?.title ?? "未命名问题",
      heat: entry.target?.metrics_area?.text ?? entry.detail_text,
      url: toZhihuUrl(entry.target?.link?.url ?? entry.target?.url),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "zhihu",
        ...sourceNames.zhihu,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "知乎接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function toZhihuUrl(apiUrl?: string): string {
  if (!apiUrl) {
    return "https://www.zhihu.com/hot";
  }

  return apiUrl.replace("api.zhihu.com/questions", "www.zhihu.com/question");
}
