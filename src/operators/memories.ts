import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BASE_URL_API } from '@/constants';
import { currentSiteOrigin } from '@/utils';

function headers(token: string) {
  const origin = currentSiteOrigin();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(origin ? { 'x-site-origin': origin } : {})
  };
}

const BASE = `${BASE_URL_API}/aichat2/memories`;

export interface IMemoryEntry {
  id: string;
  topic: string;
  content: string;
  confidence: number;
  source: 'auto' | 'tool' | 'user';
  created_at: number;
  updated_at: number;
}

export interface IMemoryProfile {
  items: IMemoryEntry[];
  enabled: boolean;
  importJob: IMemoryImportStatus | null;
}

export interface IMemoryImportResult {
  processed: number;
  rejected: number;
  total: number;
}

export interface IMemoryImportStatus extends Partial<IMemoryImportResult> {
  id: string;
  status: 'running' | 'success' | 'failed';
  error?: string;
}

const IMPORT_POLL_INTERVAL_MS = 1500;
const IMPORT_TIMEOUT_MS = 8 * 60 * 1000;
const MAX_POLL_FAILURES = 5;

function abortError(): Error {
  const error = new Error('memory import canceled');
  error.name = 'AbortError';
  return error;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function importStatus(data: unknown): IMemoryImportStatus {
  if (!data || typeof data !== 'object') throw new Error('invalid memory import status response');
  const status = (data as { status?: unknown }).status;
  if (status !== 'running' && status !== 'success' && status !== 'failed') {
    throw new Error('invalid memory import status response');
  }
  return data as IMemoryImportStatus;
}

class MemoriesOperator {
  async getProfile(token: string): Promise<IMemoryProfile> {
    const { data } = await axios.post(BASE, { action: 'list' }, { headers: headers(token) });
    return {
      items: data?.items ?? [],
      enabled: data?.enabled !== false,
      importJob: data?.import_job ? importStatus(data.import_job) : null
    };
  }

  async setEnabled(token: string, enabled: boolean): Promise<boolean> {
    const { data } = await axios.post(BASE, { action: 'set_enabled', enabled }, { headers: headers(token) });
    return data?.enabled !== false;
  }

  async importText(token: string, text: string, options: { signal?: AbortSignal } = {}): Promise<IMemoryImportResult> {
    const requestedTaskId = uuidv4();
    let taskId = requestedTaskId;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await axios.post(
          BASE,
          { action: 'import', id: requestedTaskId, text },
          { headers: headers(token), signal: options.signal }
        );
        taskId = (data?.task_id as string | undefined) || requestedTaskId;
        break;
      } catch (error) {
        if (options.signal?.aborted || attempt === 1) throw error;
        await wait(500, options.signal);
      }
    }

    return this.waitForImport(token, taskId, options);
  }

  async waitForImport(
    token: string,
    taskId: string,
    options: { signal?: AbortSignal } = {}
  ): Promise<IMemoryImportResult> {
    const deadline = Date.now() + IMPORT_TIMEOUT_MS;
    let pollFailures = 0;
    while (Date.now() < deadline) {
      if (options.signal?.aborted) throw abortError();
      let status: IMemoryImportStatus;
      try {
        const { data } = await axios.post(
          BASE,
          { action: 'import_status', id: taskId },
          { headers: headers(token), signal: options.signal }
        );
        status = importStatus(data);
        pollFailures = 0;
      } catch (error) {
        if (options.signal?.aborted) throw abortError();
        pollFailures += 1;
        if (pollFailures >= MAX_POLL_FAILURES) throw error;
        await wait(Math.min(IMPORT_POLL_INTERVAL_MS * 2 ** pollFailures, 10_000), options.signal);
        continue;
      }
      if (status.status === 'success') {
        return {
          processed: status.processed ?? 0,
          rejected: status.rejected ?? 0,
          total: status.total ?? 0
        };
      }
      if (status.status === 'failed') throw new Error(status.error || 'memory import failed');
      await wait(IMPORT_POLL_INTERVAL_MS, options.signal);
    }
    throw new Error('memory import timed out');
  }

  async remove(token: string, id: string): Promise<boolean> {
    const { data } = await axios.post(BASE, { action: 'delete', id }, { headers: headers(token) });
    return !!data?.success;
  }

  async clear(token: string): Promise<boolean> {
    const { data } = await axios.post(BASE, { action: 'clear' }, { headers: headers(token) });
    return !!data?.success;
  }
}

export const memoriesOperator = new MemoriesOperator();
export default memoriesOperator;
