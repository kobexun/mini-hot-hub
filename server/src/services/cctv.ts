import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:cctv";
const ttlSeconds = 420;
const endpoint = "https://news.cctv.com/2019/07/gaiban/cmsdatainterface/page/news_1.jsonp";

interface CctvNewsItem {
  title?: string;
  focus_date?: string;
  url?: string;
}

interface CctvResponse {
  data?: {
    list?: CctvNewsItem[];
  };
}

export async function fetchCctvHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        referer: "https://news.cctv.com/",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
    });

    if (!response.ok) {
      throw new Error(`CCTV responded ${response.status}`);
    }

    const json = parseJsonp<CctvResponse>(await response.text());

    if (!json.data?.list) {
      throw new Error("CCTV response is invalid");
    }

    const items: HotItem[] = json.data.list.slice(0, 12).map((item, index) => ({
      rank: index + 1,
      title: item.title ?? "未命名新闻",
      heat: formatPublishTime(item.focus_date),
      url: item.url ?? "https://news.cctv.com/",
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "cctv",
        ...sourceNames.cctv,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "央视新闻接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function parseJsonp<T>(text: string): T {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");

  if (start < 0 || end <= start) {
    throw new Error("CCTV JSONP response is invalid");
  }

  return JSON.parse(text.slice(start + 1, end)) as T;
}

function formatPublishTime(dateText?: string): string | undefined {
  if (!dateText) {
    return undefined;
  }

  const time = dateText.slice(11, 16);
  return time ? `${time} 发布` : dateText;
}
