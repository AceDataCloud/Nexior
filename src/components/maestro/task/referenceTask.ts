import type { IMaestroTask } from '@/models';
import { maestroOperator } from '@/operators';

const CACHE_LIMIT = 50;
const REQUEST_TIMEOUT_MS = 10_000;
const cache = new Map<string, IMaestroTask>();
const inFlight = new Map<string, { controller: AbortController; promise: Promise<IMaestroTask | undefined> }>();

const cacheTask = (key: string, task: IMaestroTask): void => {
  cache.set(key, task);
  if (cache.size > CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
};

export async function getMaestroReferenceTask(
  taskId: string,
  options: { token: string; credentialKey: string }
): Promise<IMaestroTask | undefined> {
  const key = `${options.credentialKey}:${taskId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = inFlight.get(key);
  if (pending) return pending.promise;

  const controller = new AbortController();
  let timeout: number | undefined;
  const entry = {
    controller,
    promise: undefined as unknown as Promise<IMaestroTask | undefined>
  };
  const fetchTask = maestroOperator
    .task(taskId, { token: options.token, signal: controller.signal })
    .then(({ data }) => {
      if (controller.signal.aborted) return undefined;
      cacheTask(key, data);
      return data;
    })
    .catch((error) => {
      if (!controller.signal.aborted) console.warn('failed to load maestro remix reference task', taskId, error);
      return undefined;
    });
  const timedOut = new Promise<undefined>((resolve) => {
    timeout = window.setTimeout(() => {
      controller.abort();
      resolve(undefined);
    }, REQUEST_TIMEOUT_MS);
  });
  entry.promise = Promise.race([fetchTask, timedOut]).finally(() => {
    if (timeout !== undefined) window.clearTimeout(timeout);
    if (inFlight.get(key) === entry) inFlight.delete(key);
  });

  inFlight.set(key, entry);
  return entry.promise;
}

export function clearMaestroReferenceTaskCache(): void {
  for (const request of inFlight.values()) request.controller.abort();
  cache.clear();
  inFlight.clear();
}
