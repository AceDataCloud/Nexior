type TaskLike = {
  response?: { success?: boolean; error?: unknown; state?: string; video_url?: string; data?: unknown };
  status?: string;
  state?: string;
};

const RUNNING = new Set(['queued', 'pending', 'processing', 'running']);
const TERMINAL = new Set([
  'success',
  'succeed',
  'succeeded',
  'completed',
  'finished',
  'failure',
  'failed',
  'cancelled',
  'dead'
]);
const value = (input: unknown) => String(input || '').toLowerCase();

export const pendingUntilResponse = (task: TaskLike) => !task.response;

export const pendingByResponseState = (task: TaskLike) => {
  if (!task.response) return true;
  const data = Array.isArray(task.response.data) ? task.response.data[0] : task.response.data;
  return RUNNING.has(
    value(
      (data as { state?: string; status?: string } | undefined)?.state ||
        (data as { state?: string; status?: string } | undefined)?.status ||
        task.response.state
    )
  );
};

export const pendingUntilSuccessfulMedia = (task: TaskLike) =>
  !task.response || (!task.response.error && task.response.success !== true && !task.response.video_url);

export const pendingByTopLevelStatus = (task: TaskLike) => RUNNING.has(value(task.status || task.state));
export const pendingUntilResponseOrTerminalStatus = (task: TaskLike) =>
  !task.response && !TERMINAL.has(value(task.status || task.state));

type PendingRefreshOptions<T> = {
  getItems: () => T[];
  isPending: (task: T) => boolean;
  fetch: (ids: string[]) => Promise<T[]>;
  commit: (items: T[]) => void;
};

export async function refreshPendingTaskItems<T extends { id?: string }>({
  getItems,
  isPending,
  fetch,
  commit
}: PendingRefreshOptions<T>): Promise<T[]> {
  const ids = getItems()
    .filter(isPending)
    .slice(-20)
    .map((task) => task.id)
    .filter((id): id is string => Boolean(id));
  if (!ids.length) return [];
  const result = await fetch(ids);
  const updates = new Map(result.map((task) => [task.id, task]));
  let changed = false;
  const next = getItems().map((task) => {
    const update = updates.get(task.id);
    if (update && isPending(task) && !isPending(update)) {
      changed = true;
      return update;
    }
    return task;
  });
  if (changed) commit(next);
  return result;
}
