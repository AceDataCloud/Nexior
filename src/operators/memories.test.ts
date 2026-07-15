import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoriesOperator } from './memories';

vi.mock('@/utils', () => ({ currentSiteOrigin: () => '' }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('memoriesOperator', () => {
  it('loads entries and the account preference', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [{ id: 'm1' }], enabled: false } });

    await expect(memoriesOperator.getProfile('token')).resolves.toMatchObject({
      items: [{ id: 'm1' }],
      enabled: false,
      importJob: null
    });
  });

  it('defaults legacy profiles to enabled', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [] } });

    await expect(memoriesOperator.getProfile('token')).resolves.toEqual({ items: [], enabled: true, importJob: null });
  });

  it('hydrates a running import job with the profile', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { items: [], enabled: true, import_job: { id: 'job-0', status: 'running' } }
    });

    await expect(memoriesOperator.getProfile('token')).resolves.toMatchObject({
      importJob: { id: 'job-0', status: 'running' }
    });
  });

  it('persists the account preference', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { enabled: false } });

    await expect(memoriesOperator.setEnabled('token', false)).resolves.toBe(false);
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/aichat2/memories'),
      { action: 'set_enabled', enabled: false },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) })
    );
  });

  it('starts an import and returns its completed status', async () => {
    const post = vi
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { task_id: 'job-1', status: 'running' } })
      .mockResolvedValueOnce({ data: { id: 'job-1', status: 'success', processed: 3, rejected: 1, total: 8 } });

    await expect(memoriesOperator.importText('token', '- Prefers concise answers.')).resolves.toEqual({
      processed: 3,
      rejected: 1,
      total: 8
    });
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/aichat2/memories'),
      expect.objectContaining({
        action: 'import',
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        text: '- Prefers concise answers.'
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        signal: undefined
      })
    );
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/aichat2/memories'),
      { action: 'import_status', id: 'job-1' },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
        signal: undefined
      })
    );
  });

  it('surfaces a failed import job', async () => {
    vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { task_id: 'job-2', status: 'running' } })
      .mockResolvedValueOnce({ data: { id: 'job-2', status: 'failed', error: 'memory import extraction failed' } });

    await expect(memoriesOperator.importText('token', 'random export')).rejects.toThrow(
      'memory import extraction failed'
    );
  });

  it('supports polling an existing job after page reload', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { id: 'job-resume', status: 'success', processed: 2, rejected: 0, total: 48 }
    });

    await expect(memoriesOperator.waitForImport('token', 'job-resume')).resolves.toEqual({
      processed: 2,
      rejected: 0,
      total: 48
    });
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/aichat2/memories'),
      { action: 'import_status', id: 'job-resume' },
      expect.anything()
    );
  });

  it('retries a transient admission failure with the same task id', async () => {
    vi.useFakeTimers();
    const post = vi
      .spyOn(axios, 'post')
      .mockRejectedValueOnce(new Error('network reset'))
      .mockResolvedValueOnce({ data: { task_id: 'job-retry', status: 'running' } })
      .mockResolvedValueOnce({ data: { id: 'job-retry', status: 'success', processed: 1, rejected: 0, total: 48 } });

    const importPromise = memoriesOperator.importText('token', 'random export');
    await vi.advanceTimersByTimeAsync(500);
    await expect(importPromise).resolves.toMatchObject({ processed: 1 });

    const admissionCalls = post.mock.calls.filter(
      ([, payload]) => (payload as { action?: string }).action === 'import'
    );
    expect(admissionCalls).toHaveLength(2);
    expect((admissionCalls[0][1] as { id: string }).id).toBe((admissionCalls[1][1] as { id: string }).id);
  });

  it('stops polling when aborted', async () => {
    const controller = new AbortController();
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { task_id: 'job-abort', status: 'running' } });
    controller.abort();

    await expect(
      memoriesOperator.importText('token', 'random export', { signal: controller.signal })
    ).rejects.toMatchObject({
      name: 'AbortError'
    });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
