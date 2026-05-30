import { useEffect, useState } from "react";
import type { HotPlatform } from "../../../shared/src/types";

interface HotCardProps {
  platform: HotPlatform;
}

const desktopVisibleCount = 8;
const mobileVisibleCount = 5;

export function HotCard({ platform }: HotCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = useResponsiveVisibleCount();
  const hiddenCount = Math.max(0, platform.items.length - visibleCount);
  const hasMore = hiddenCount > 0;
  const visibleItems = expanded ? platform.items : platform.items.slice(0, visibleCount);

  return (
    <article className={`hot-card hot-card-${platform.source}`} id={`source-${platform.source}`}>
      <header className="card-header">
        <div>
          <p className="source-name">{platform.sourceName}</p>
          <h2>{platform.listName}</h2>
        </div>
        <span className="updated-at">{formatUpdatedAt(platform.updatedAt)}</span>
      </header>

      {platform.error ? (
        <div className="card-alert" role="status">
          {platform.message ?? "该平台暂时不可用"}
        </div>
      ) : null}

      {platform.items.length > 0 ? (
        <>
          <ol className="hot-list">
            {visibleItems.map((item) => (
              <li key={`${platform.source}-${item.rank}-${item.title}`}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <span className="rank">{item.rank}</span>
                  <span className="item-main">
                    <span className="title">{item.title}</span>
                    {item.heat ? <span className="heat">{item.heat}</span> : null}
                  </span>
                </a>
              </li>
            ))}
          </ol>
          {hasMore ? (
            <button
              className="card-more-button"
              onClick={() => {
                setExpanded((value) => !value);
              }}
              type="button"
            >
              {expanded ? "收起" : `展开剩余 ${hiddenCount} 条`}
              <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
            </button>
          ) : null}
        </>
      ) : (
        <p className="card-empty">暂无可展示数据</p>
      )}
    </article>
  );
}

function useResponsiveVisibleCount(): number {
  const [visibleCount, setVisibleCount] = useState(desktopVisibleCount);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateVisibleCount = () => {
      setVisibleCount(mediaQuery.matches ? mobileVisibleCount : desktopVisibleCount);
    };

    updateVisibleCount();
    mediaQuery.addEventListener("change", updateVisibleCount);

    return () => {
      mediaQuery.removeEventListener("change", updateVisibleCount);
    };
  }, []);

  return visibleCount;
}

function formatUpdatedAt(updatedAt: string): string {
  const timestamp = new Date(updatedAt).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (Number.isNaN(timestamp)) {
    return "更新时间未知";
  }

  if (diffMinutes < 1) {
    return "刚刚更新";
  }

  return `更新于 ${diffMinutes} 分钟前`;
}
