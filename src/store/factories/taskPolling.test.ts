import { describe, expect, it, vi } from 'vitest';
import {
  pendingByResponseState,
  pendingByTopLevelStatus,
  pendingUntilResponse,
  pendingUntilResponseOrTerminalStatus,
  pendingUntilSuccessfulMedia,
  refreshPendingTaskItems
} from './taskPolling';

type TestTask = { id?: string; response?: { success?: boolean } };

describe('task polling predicates', () => {
  it('recognizes wrapper, nested, media, and top-level terminal states', () => {
    expect(pendingUntilResponse({})).toBe(true);
    expect(pendingUntilResponse({ response: { success: true } })).toBe(false);
    expect(pendingByResponseState({ response: { data: { status: 'running' } } })).toBe(true);
    expect(pendingByResponseState({ response: { data: { status: 'succeeded' } } })).toBe(false);
    expect(pendingUntilSuccessfulMedia({ response: { video_url: 'https://example.com/video.mp4' } })).toBe(false);
    expect(pendingUntilSuccessfulMedia({ response: { success: true } })).toBe(false);
    expect(pendingByTopLevelStatus({ status: 'running' })).toBe(true);
    expect(pendingUntilResponseOrTerminalStatus({ status: 'failed' })).toBe(false);
    expect(pendingUntilResponseOrTerminalStatus({ state: 'finished' })).toBe(false);
  });

  it('does not commit unchanged pending snapshots', async () => {
    const commit = vi.fn();
    await refreshPendingTaskItems<TestTask>({
      getItems: () => [{ id: 'a' }],
      isPending: pendingUntilResponse,
      fetch: async () => [{ id: 'a' }],
      commit
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it('applies terminal updates to the latest task list', async () => {
    const commit = vi.fn();
    let current: TestTask[] = [{ id: 'a' }];
    let release!: (items: TestTask[]) => void;
    const fetch = () => new Promise<TestTask[]>((resolve) => (release = resolve));
    const request = refreshPendingTaskItems({
      getItems: () => current,
      isPending: pendingUntilResponse,
      fetch,
      commit
    });
    current = [{ id: 'new', response: { success: true } }, { id: 'a' }];
    release([{ id: 'a', response: { success: true } }]);
    await request;
    expect(commit).toHaveBeenCalledWith([
      { id: 'new', response: { success: true } },
      { id: 'a', response: { success: true } }
    ]);
  });

  it('replaces a pending item in place when it reaches terminal state', async () => {
    const commit = vi.fn();
    const done = { id: 'a', response: { success: true } };
    await refreshPendingTaskItems<TestTask>({
      getItems: () => [{ id: 'before', response: { success: true } }, { id: 'a' }],
      isPending: pendingUntilResponse,
      fetch: async () => [done],
      commit
    });
    expect(commit).toHaveBeenCalledWith([{ id: 'before', response: { success: true } }, done]);
  });
});
