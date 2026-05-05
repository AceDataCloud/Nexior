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
   * When true (default), restores scrollTop after prepending so the visible
   * content stays in place — good for chat/document-like lists. When false,
   * leaves scrollTop alone so newly prepended content visibly slides in at
   * the top — good for image-grid / task-list pages where the user just
   * wants to see older items appear. The "false" mode also preserves the
   * scrollTop=0 boundary, so a continued upward gesture keeps firing
   * reach-top events for further loads instead of getting stranded after
   * the first page.
   */
  preserveScroll?: boolean;
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
    preserveScroll = true,
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
  // "userWasAtTop" means the user's gesture brought them inside the threshold
  // band before this load started. Captured here, before any setLoading or
  // bump that would obscure the answer.
  const userWasAtTop = previousScrollTop <= reachThreshold;

  setLoading(true);
  try {
    await fetch(oldest.created_at);
    await nextTick();
    const latest = getTasks ? getTasks() : tasks;
    const newLength = latest?.items?.length || 0;
    const hasMore = latest?.total !== undefined ? newLength < (latest.total || 0) : newLength > previousLength;
    const scrollEl = getScrollElement?.();
    if (preserveScroll && scrollEl) {
      // Bump scrollTop so the visible content stays in place. Only used by
      // pages that preferred visual continuity (chat-like, long-content lists).
      const newHeight = scrollEl.scrollHeight;
      scrollEl.scrollTop = newHeight - previousHeight + previousScrollTop;
    }
    // Recurse one extra time when the user genuinely gestured to the top —
    // gives them ~2 pages of buffer per gesture so they don't have to repeat
    // the gesture for every single page. The recursive call's previousScrollTop
    // will be the bumped value (preserveScroll=true) or 0 (preserveScroll=false);
    // either way the depth cap stops further recursion from this branch.
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
