import type { IUser } from '@/models';
import { userOperator } from '@/operators/user';

const METADATA_KEY = 'x402_tasks';
const MAX_TASK_IDS = 100;

export type X402TaskService = 'nanobanana' | 'openaiimage';

type TaskMap = Partial<Record<X402TaskService, string[]>>;

function taskMap(user?: IUser): TaskMap {
  const value = user?.metadata?.[METADATA_KEY];
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as TaskMap) : {};
}

export function syncedX402TaskIds(user: IUser | undefined, service: X402TaskService): string[] {
  const ids = taskMap(user)[service];
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && id.length > 0) : [];
}

export async function syncX402TaskId(service: X402TaskService, taskId: string): Promise<IUser> {
  const { data: latest } = await userOperator.getMe();
  const metadata = { ...(latest.metadata || {}) };
  const tasks = { ...taskMap(latest) };
  tasks[service] = [taskId, ...syncedX402TaskIds(latest, service).filter((id) => id !== taskId)].slice(0, MAX_TASK_IDS);
  const { data: updated } = await userOperator.updateMe({
    ...latest,
    metadata: { ...metadata, [METADATA_KEY]: tasks }
  });
  return updated;
}
