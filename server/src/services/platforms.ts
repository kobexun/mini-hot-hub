import type { HotPlatform, HotSource } from "../../../shared/src/types";
import { fetch36KrHot } from "./36kr";
import { fetchBilibiliHot } from "./bilibili";
import { fetchCctvHot } from "./cctv";
import { sourceNames } from "./meta";
import { fetchQbitaiHot } from "./qbitai";
import { fetchThepaperHot } from "./thepaper";
import { fetchToutiaoHot } from "./toutiao";
import { fetchWeiboHot } from "./weibo";
import { fetchZhihuHot } from "./zhihu";

export const hotSources: HotSource[] = [
  "bilibili",
  "zhihu",
  "weibo",
  "thepaper",
  "toutiao",
  "cctv",
  "36kr",
  "qbitai",
];

export const platformFetchers: Record<HotSource, () => Promise<HotPlatform>> = {
  bilibili: fetchBilibiliHot,
  zhihu: fetchZhihuHot,
  weibo: fetchWeiboHot,
  thepaper: fetchThepaperHot,
  toutiao: fetchToutiaoHot,
  cctv: fetchCctvHot,
  "36kr": fetch36KrHot,
  qbitai: fetchQbitaiHot,
};

export function isHotSource(source: string): source is HotSource {
  return hotSources.includes(source as HotSource);
}

export function createErrorPlatform(source: HotSource, message: string): HotPlatform {
  const meta = sourceNames[source];

  return {
    source,
    ...meta,
    updatedAt: new Date().toISOString(),
    items: [],
    error: true,
    message,
  };
}
