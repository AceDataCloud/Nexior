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
  const previousScrollTop = el?.scrollTop || 0;
  const previousLength = currentLength;
  // "userWasAtTop" — captured before setLoading. If the user's gesture put
  // them inside the threshold band, recurse once more so each gesture loads
  // ~2 pages of buffer (smoother feel; user doesn't have to repeat the
  // gesture for every page). With the no-bump prepend below, scrollTop
  // stays at 0 so this also keeps the boundary armed for future gestures.
  const userWasAtTop = previousScrollTop <= reachThreshold;

  setLoading(true);
  try {
    await fetch(oldest.created_at);
    await nextTick();
    const latest = getTasks ? getTasks() : tasks;
    const newLength = latest?.items?.length || 0;
    const hasMore = latest?.total !== undefined ? newLength < (latest.total || 0) : newLength > previousLength;
    // INTENTIONAL: do NOT bump scrollTop after the prepend.
    //
    // Old behavior was `scrollEl.scrollTop = newHeight - previousHeight + previousScrollTop`,
    // meant to keep the visible content in place. For these task-list pages
    // (image / video grids sorted newest-first) that bump *broke* the pagination UX:
    //
    //   1. User scrolls to top (scrollTop=0), reach-top fires
    //   2. Page loads
    //   3. Bump moves scrollTop to ~newPageHeight (often >1000px)
    //   4. User has stopped gesturing (they hit the top boundary already)
    //   5. No further scroll events → next reach-top never fires
    //   6. User has to manually scroll DOWN then UP to manufacture an event
    //
    // Leaving scrollTop alone:
    //   • prepended items visibly slide in above (Twitter / IG style — what
    //     users expect for "load older items" in newest-first grids)
    //   • scrollTop=0 boundary stays armed → next gesture (or the recursion
    //     below) immediately picks up the next page
    //   • no manufactured-gesture workaround needed
    //
    // Recurse one extra time if the user genuinely gestured to the top,
    // capped at MAX_DEPTH to prevent runaway loads.
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
