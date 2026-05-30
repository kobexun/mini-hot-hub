import { useEffect, useState } from "react";
import type { HotPlatform, HotSource } from "../../shared/src/types";
import { fetchHotPlatform, hotSources } from "./api/hot";
import { HotCard } from "./components/HotCard";

type PlatformState =
  | { source: HotSource; status: "loading"; platform?: HotPlatform }
  | { source: HotSource; status: "ready"; platform: HotPlatform };

interface PageState {
  platforms: PlatformState[];
  refreshing: boolean;
}

const sourceMeta: Record<HotSource, { sourceName: string; listName: string }> = {
  bilibili: { sourceName: "B 站", listName: "热门视频" },
  zhihu: { sourceName: "知乎", listName: "热榜" },
  weibo: { sourceName: "微博", listName: "热搜榜" },
  thepaper: { sourceName: "澎湃新闻", listName: "新闻热榜" },
  toutiao: { sourceName: "今日头条", listName: "头条热榜" },
  cctv: { sourceName: "央视新闻", listName: "最新新闻" },
  "36kr": { sourceName: "36氪", listName: "人气榜" },
  qbitai: { sourceName: "量子位", listName: "AI 资讯" },
};

const initialPlatforms: PlatformState[] = hotSources.map((source) => ({
  source,
  status: "loading",
}));

export function App() {
  const [state, setState] = useState<PageState>({
    platforms: initialPlatforms,
    refreshing: false,
  });

  function loadPlatforms(options: { keepData?: boolean } = {}) {
    if (options.keepData) {
      setState((current) => ({ ...current, refreshing: true }));
    } else {
      setState({ platforms: initialPlatforms, refreshing: false });
    }

    const requests = hotSources.map((source) =>
      fetchHotPlatform(source)
        .then((platform) => {
          setState((current) => ({
            ...current,
            platforms: current.platforms.map((item) =>
              item.source === source ? { source, status: "ready", platform } : item,
            ),
          }));
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "热榜加载失败";
          const platform = createClientErrorPlatform(source, message);

          setState((current) => ({
            ...current,
            platforms: current.platforms.map((item) =>
              item.source === source ? { source, status: "ready", platform } : item,
            ),
          }));
        }),
    );

    return Promise.allSettled(requests).then(() => {
      setState((current) => ({
        ...current,
        refreshing: false,
      }));
    });
  }

  useEffect(() => {
    let active = true;

    const requests = hotSources.map((source) =>
      fetchHotPlatform(source)
        .then((platform) => {
          if (!active) {
            return;
          }

          setState((current) => ({
            ...current,
            platforms: current.platforms.map((item) =>
              item.source === source ? { source, status: "ready", platform } : item,
            ),
          }));
        })
        .catch((error: unknown) => {
          if (!active) {
            return;
          }

          const message = error instanceof Error ? error.message : "热榜加载失败";
          const platform = createClientErrorPlatform(source, message);

          setState((current) => ({
            ...current,
            platforms: current.platforms.map((item) =>
              item.source === source ? { source, status: "ready", platform } : item,
            ),
          }));
        }),
    );

    Promise.allSettled(requests).then(() => {
      if (active) {
        setState((current) => ({
          ...current,
          refreshing: false,
        }));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="topbar" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Mini Hot Hub</p>
          <h1 id="page-title">今日热搜</h1>
        </div>
        <div className="topbar-actions">
          <time dateTime={new Date().toISOString()}>{formatToday()}</time>
          <button
            className="refresh-button"
            disabled={state.refreshing}
            onClick={() => {
              void loadPlatforms({ keepData: true });
            }}
            type="button"
          >
            <span aria-hidden="true">↻</span>
            {state.refreshing ? "刷新中" : "刷新"}
          </button>
        </div>
      </section>

      <nav className="source-nav" aria-label="热榜来源">
        {state.platforms.map((item) => {
          const platform = item.platform;
          const meta = platform ?? sourceMeta[item.source];

          return (
            <a className={`source-chip source-chip-${item.source}`} href={`#source-${item.source}`} key={item.source}>
              <span>{meta.sourceName}</span>
              <strong>{platform ? platform.items.length : "..."}</strong>
            </a>
          );
        })}
      </nav>

      <section className="grid" aria-label="热榜列表">
        {state.platforms.map((item) =>
          item.status === "ready" ? (
            <HotCard key={item.source} platform={item.platform} />
          ) : (
            <div className="hot-card skeleton" id={`source-${item.source}`} key={item.source}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ))}
      </section>

      <footer>
        <span>数据来源：微博、知乎、B 站、澎湃新闻、今日头条、央视新闻、36氪、量子位公开接口。</span>
      </footer>
    </main>
  );
}

function createClientErrorPlatform(source: HotSource, message: string): HotPlatform {
  return {
    source,
    ...sourceMeta[source],
    updatedAt: new Date().toISOString(),
    items: [],
    error: true,
    message,
  };
}

function formatToday(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}
