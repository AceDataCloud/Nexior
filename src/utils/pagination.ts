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
  /**
   * Internal — current recursion depth. Callers should not set this.
   */
  _depth?: number;
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
    reachThreshold = 200,
    _depth = 0
  } = options;
  const MAX_DEPTH = 1; // Allow at most one extra page on top of the user's emit.
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
  // "userWasAtTop" — captured before any state changes. If the user's gesture
  // brought them inside the threshold band, recurse once more so each gesture
  // loads ~2 pages of buffer.
  const userWasAtTop = previousScrollTop <= reachThreshold;

  setLoading(true);
  try {
    await fetch(oldest.created_at);
    await nextTick();
    const latest = getTasks ? getTasks() : tasks;
    const newLength = latest?.items?.length || 0;
    const hasMore = latest?.total !== undefined ? newLength < (latest.total || 0) : newLength > previousLength;
    const scrollEl = getScrollElement?.();
    if (scrollEl) {
      // Preserve the user's visual position. These task lists are sorted
      // newest-first and start at scrollTop=BOTTOM (onScrollDown on init);
      // the user scrolls UP through history. When older rows are prepended,
      // scrollTop must be bumped by exactly the new rows' height so the
      // items the user was looking at stay in the same place — otherwise
      // their content suddenly jumps DOWN by ~newPageHeight, which is a
      // jarring page jump.
      const newHeight = scrollEl.scrollHeight;
      scrollEl.scrollTop = newHeight - previousHeight + previousScrollTop;
    }
    // Recurse one extra time when the user genuinely gestured to the top —
    // gives them ~2 pages per gesture so they don't have to repeat.
    // Combined with the one-viewport reachThreshold in ScrollList, the next
    // user gesture also picks up the next page seamlessly.
    if (hasMore && newLength > previousLength && userWasAtTop && !isBlocked?.() && _depth < MAX_DEPTH) {
      await loadPreviousPage({
        ...options,
        tasks: latest,
        loading: false,
        ignoreLoadingGuard: true,
        _depth: _depth + 1
      });
    }
  } finally {
    setLoading(false);
  }
}
