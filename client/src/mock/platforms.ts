import type { HotPlatform } from "../../../shared/src/types";

export const mockPlatforms: HotPlatform[] = [
  {
    source: "bilibili",
    sourceName: "B 站",
    listName: "热门视频",
    updatedAt: new Date().toISOString(),
    items: [
      { rank: 1, title: "示例热门视频", heat: "120.4 万观看", url: "https://www.bilibili.com/v/popular/all" },
    ],
  },
];
