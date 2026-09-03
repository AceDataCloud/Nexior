import { describe, expect, it, vi } from 'vitest';
import { taskPollingMixin } from './taskPollingMixin';

const methods = (module = 'demo') => taskPollingMixin(module).methods as { onPollTasks: () => Promise<void> };

describe('taskPollingMixin', () => {
  it('isolates overlapping poll locks per component instance', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => (release = resolve));
    const dispatch = vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(undefined);
    const poll = methods().onPollTasks;
    const first: any = { taskPollRunning: false, taskHistoryPolledAt: Date.now(), $store: { dispatch } };
    const second: any = { taskPollRunning: false, taskHistoryPolledAt: Date.now(), $store: { dispatch } };

    const firstPoll = poll.call(first);
    await poll.call(second);
    expect(dispatch).toHaveBeenCalledTimes(2);
    release();
    await firstPoll;
  });

  it('runs due history independently when pending reconciliation fails', async () => {
    const dispatch = vi.fn().mockRejectedValue(new Error('pending failed'));
    const onGetTasks = vi.fn().mockResolvedValue(undefined);
    const state: any = { taskPollRunning: false, taskHistoryPolledAt: 0, $store: { dispatch }, onGetTasks };

    await methods().onPollTasks.call(state);

    expect(onGetTasks).toHaveBeenCalledOnce();
    expect(state.taskPollRunning).toBe(false);
  });
});
