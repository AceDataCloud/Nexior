// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMaestroTask } from '@/models';

const maestroOperatorMock = vi.hoisted(() => ({
  task: vi.fn()
}));

vi.mock('@/operators', () => ({
  maestroOperator: maestroOperatorMock
}));

import { clearMaestroReferenceTaskCache, getMaestroReferenceTask } from './referenceTask';

const sourceTask: IMaestroTask = {
  id: 'source-task',
  status: 'succeeded',
  response: { success: true, task_id: 'source-task', data: { variants: [] } }
};
const options = { token: 'test-token', credentialKey: 'credential-1' };

describe('maestro reference task loader', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    clearMaestroReferenceTaskCache();
  });

  it('deduplicates concurrent requests and caches the resolved task', async () => {
    let resolveRequest: ((value: { data: IMaestroTask }) => void) | undefined;
    maestroOperatorMock.task.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const first = getMaestroReferenceTask(sourceTask.id, options);
    const second = getMaestroReferenceTask(sourceTask.id, options);
    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(1);
    expect(maestroOperatorMock.task).toHaveBeenCalledWith(sourceTask.id, {
      token: options.token,
      signal: expect.any(AbortSignal)
    });

    resolveRequest?.({ data: sourceTask });
    await expect(Promise.all([first, second])).resolves.toEqual([sourceTask, sourceTask]);
    await expect(getMaestroReferenceTask(sourceTask.id, options)).resolves.toEqual(sourceTask);
    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures so a later caller can retry', async () => {
    maestroOperatorMock.task.mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce({ data: sourceTask });

    await expect(getMaestroReferenceTask(sourceTask.id, options)).resolves.toBeUndefined();
    await expect(getMaestroReferenceTask(sourceTask.id, options)).resolves.toEqual(sourceTask);
    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(2);
  });

  it('settles a stalled request and lets a later caller start a new one', async () => {
    vi.useFakeTimers();
    maestroOperatorMock.task.mockReturnValue(new Promise(() => undefined));

    const first = getMaestroReferenceTask(sourceTask.id, options);
    await vi.runAllTimersAsync();
    await expect(first).resolves.toBeUndefined();

    void getMaestroReferenceTask(sourceTask.id, options);
    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(2);
  });

  it('isolates cached tasks by credential', async () => {
    maestroOperatorMock.task.mockResolvedValue({ data: sourceTask });

    await getMaestroReferenceTask(sourceTask.id, options);
    await getMaestroReferenceTask(sourceTask.id, { ...options, credentialKey: 'credential-2' });

    expect(maestroOperatorMock.task).toHaveBeenCalledTimes(2);
  });
});
