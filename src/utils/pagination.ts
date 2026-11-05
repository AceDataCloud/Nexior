import { nextTick } from 'vue';

export type TasksLike = {
  items?: { id?: string; created_at?: number }[];
  total?: number;
};

export async function loadPreviousPage(options: {
  getTasks: () => TasksLike | undefined;
  loading: boolean;
  setLoading: (value: boolean) => void;
  isBlocked?: () => boolean;
  fetch: (createdAtMax: number) => Promise<unknown>;
  getScrollElement?: () => HTMLElement | undefined;
}): Promise<'loaded' | 'exhausted' | 'blocked'> {
  const { getTasks, loading, setLoading, isBlocked, fetch, getScrollElement } = options;
  if (loading || isBlocked?.()) return 'blocked';
  const oldest = getTasks()?.items?.[0]?.created_at;
  if (oldest === undefined) return 'exhausted';

  // Cursor responses may report the page's count, not the history's total.
  // Only an empty/non-advancing page proves that there is no earlier history.
  setLoading(true);
  try {
    const el = getScrollElement?.();
    const previousHeight = el?.scrollHeight || 0;
    const result = await fetch(oldest);
    if (result === undefined) return 'blocked';
    // Capture where the user is NOW, including movement during the request.
    const top = el?.scrollTop || 0;
    await nextTick();
    const scrollEl = getScrollElement?.();
    if (scrollEl && scrollEl === el) {
      scrollEl.scrollTop = Math.max(0, top + scrollEl.scrollHeight - previousHeight);
    }
    const nextOldest = getTasks()?.items?.[0]?.created_at;
    return nextOldest !== undefined && nextOldest < oldest ? 'loaded' : 'exhausted';
  } finally {
    setLoading(false);
  }
}
