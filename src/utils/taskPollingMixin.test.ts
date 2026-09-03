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

  it('refreshes task history every five seconds', async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const onGetTasks = vi.fn().mockResolvedValue(undefined);
    const now = Date.now();
    const state: any = { taskPollRunning: false, taskHistoryPolledAt: now, $store: { dispatch }, onGetTasks };
    const nowSpy = vi.spyOn(Date, 'now');

    nowSpy.mockReturnValue(now + 4999);
    await methods().onPollTasks.call(state);
    expect(onGetTasks).not.toHaveBeenCalled();

    nowSpy.mockReturnValue(now + 5000);
    await methods().onPollTasks.call(state);
    expect(onGetTasks).toHaveBeenCalledOnce();

    nowSpy.mockRestore();
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
