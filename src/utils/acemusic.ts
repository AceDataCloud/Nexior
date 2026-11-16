import type { IAcemusicTask, IAcemusicAudio } from '@/models';
const TERMINAL = new Set(['succeeded', 'complete', 'completed', 'failed', 'partial_failed', 'cancelled', 'canceled']);
export const acemusicTaskState = (task: IAcemusicTask): string =>
  task.state || task.status || task.response?.state || task.response?.status || 'processing';
export const isAcemusicTaskPending = (task: IAcemusicTask): boolean => !TERMINAL.has(acemusicTaskState(task));
export const isAcemusicAudioPlayable = (audio: IAcemusicAudio): boolean =>
  Boolean(audio.audio_url && !['failed', 'cancelled', 'canceled'].includes(audio.state || ''));

/** A slower poll must not replace a final result with an earlier running snapshot. */
export function mergeAcemusicTasks(existing: IAcemusicTask[], incoming: IAcemusicTask[]): IAcemusicTask[] {
  const tasks = new Map(existing.map((task) => [task.id, task]));
  for (const task of incoming) {
    const previous = tasks.get(task.id);
    if (previous && !isAcemusicTaskPending(previous) && isAcemusicTaskPending(task)) continue;
    tasks.set(task.id, task);
  }
  return [...tasks.values()].sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}
