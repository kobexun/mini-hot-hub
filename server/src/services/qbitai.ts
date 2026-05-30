import type { HotItem, HotPlatform } from "../../../shared/src/types";
import { getAnyCache, getFreshCache, setCache } from "../utils/cache";
import { fetchWithTimeout } from "../utils/fetch";
import { sourceNames } from "./meta";

const cacheKey = "hot:qbitai";
const ttlSeconds = 600;
const endpoint = "https://qbitai.com/wp-json/wp/v2/posts?per_page=12&_fields=id,date,link,title";

interface QbitaiPost {
  id?: number;
  date?: string;
  link?: string;
  title?: {
    rendered?: string;
  };
}

export async function fetchQbitaiHot(): Promise<HotPlatform> {
  const fresh = getFreshCache<HotPlatform>(cacheKey);
  if (fresh) {
    return fresh;
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        accept: "application/json",
        referer: "https://www.qbitai.com/",
        "user-agent": "Mozilla/5.0 mini-hot-hub",
      },
    });

    if (!response.ok) {
      throw new Error(`QbitAI responded ${response.status}`);
    }

    const json = (await response.json()) as QbitaiPost[];

    if (!Array.isArray(json)) {
      throw new Error("QbitAI response is invalid");
    }

    const items: HotItem[] = json.slice(0, 12).map((post, index) => ({
      rank: index + 1,
      title: normalizeTitle(post.title?.rendered) ?? "未命名 AI 资讯",
      heat: formatDate(post.date),
      url: post.link ?? toQbitaiUrl(post.id),
    }));

    return setCache<HotPlatform>(
      cacheKey,
      {
        source: "qbitai",
        ...sourceNames.qbitai,
        updatedAt: new Date().toISOString(),
        items,
      },
      ttlSeconds,
    );
  } catch (error) {
    const stale = getAnyCache<HotPlatform>(cacheKey);
    if (stale) {
      return { ...stale, error: true, message: "量子位接口暂时不可用，正在显示缓存数据。" };
    }

    throw error;
  }
}

function normalizeTitle(title?: string): string | undefined {
  if (!title) {
    return undefined;
  }

  return title
    .replace(/<[^>]+>/g, "")
    .replace(/&#8211;/g, "–")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .trim();
}

function formatDate(date?: string): string | undefined {
  if (!date) {
    return undefined;
  }

  const publishedAt = new Date(date);

  if (Number.isNaN(publishedAt.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(publishedAt);
}

function toQbitaiUrl(id?: number): string {
  if (!id) {
    return "https://www.qbitai.com/";
  }

  return `https://www.qbitai.com/?p=${id}`;
}
