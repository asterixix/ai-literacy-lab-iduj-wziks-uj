"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_BATCH = 30;

export function useInfiniteScroll<T>(items: T[], batchSize = DEFAULT_BATCH) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setVisibleCount(batchSize);
  }, [batchSize]);

  useEffect(() => {
    reset();
  }, [items, reset]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + batchSize, items.length));
        }
      },
      { rootMargin: "240px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batchSize, hasMore, items.length]);

  return {
    visibleItems,
    visibleCount,
    totalCount: items.length,
    hasMore,
    sentinelRef,
    reset,
  };
}
