import type { ISunoTask } from '@/models';

// Server persistence handles reloads. This session guard also rejects stale
// history/poll responses that started before the removal was acknowledged.
export function filterRemovedAudios(tasks: ISunoTask[], removed: Record<string, string[]> = {}): ISunoTask[] {
  return tasks.flatMap((task) => {
    const ids = task.id ? removed[task.id] : undefined;
    const data = task.response?.data;
    if (!ids?.length) return [task];
    if (!Array.isArray(data)) return [];
    const visible = data.filter((audio) => !audio.id || !ids.includes(audio.id));
    return visible.length ? [{ ...task, response: { ...task.response, data: visible } }] : [];
  });
}
