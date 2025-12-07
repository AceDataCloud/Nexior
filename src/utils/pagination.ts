import { nextTick } from 'vue';

type TasksLike = {
  items?: { created_at?: number }[];
  total?: number;
};

export async function loadPreviousPage(options: {
  tasks?: TasksLike;
  getTasks?: () => TasksLike | undefined;
  loading: boolean;
  ignoreLoadingGuard?: boolean;
  setLoading: (value: boolean) => void;
  isBlocked?: () => boolean;
  fetch: (createdAtMax: number) => Promise<any>;
  getScrollElement?: () => HTMLElement | undefined;
  reachThreshold?: number;
}) {
  const {
    tasks,
    getTasks,
    loading,
    ignoreLoadingGuard,
    setLoading,
    isBlocked,
    fetch,
    getScrollElement,
    reachThreshold = 40
  } = options;
  const currentTasks = getTasks ? getTasks() : tasks;
  if ((loading && !ignoreLoadingGuard) || isBlocked?.()) {
    return;
  }

  const total = currentTasks?.total;
  const currentLength = currentTasks?.items?.length || 0;
  if (total !== undefined && total <= currentLength) {
    return;
  }

  const oldest = currentTasks?.items?.[0];
  if (!oldest?.created_at) {
    return;
  }

  const el = getScrollElement?.();
  const previousHeight = el?.scrollHeight || 0;
  const previousScrollTop = el?.scrollTop || 0;
  const previousLength = currentLength;

  setLoading(true);
  try {
    await fetch(oldest.created_at);
    await nextTick();
    const latest = getTasks ? getTasks() : tasks;
    const newLength = latest?.items?.length || 0;
    const hasMore = latest?.total !== undefined ? newLength < (latest.total || 0) : newLength > previousLength;
    const scrollEl = getScrollElement?.();
    if (scrollEl) {
      const newHeight = scrollEl.scrollHeight;
      scrollEl.scrollTop = newHeight - previousHeight + previousScrollTop;
    }
    // If仍在顶部附近且还有更多数据，自动继续拉取，避免需要人为下滑再上滑。
    if (hasMore && newLength > previousLength && scrollEl && scrollEl.scrollTop <= reachThreshold && !isBlocked?.()) {
      await loadPreviousPage({
        ...options,
        tasks: latest,
        loading: false,
        ignoreLoadingGuard: true
      });
    }
  } finally {
    setLoading(false);
  }
}
