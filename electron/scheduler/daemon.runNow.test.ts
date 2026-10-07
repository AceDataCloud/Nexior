import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listLocalTasks: vi.fn(),
  claimRun: vi.fn(),
  finishRun: vi.fn(),
  executeRun: vi.fn()
}));

vi.mock('./credentials', () => ({
  getToken: () => 'token',
  getDeviceId: () => 'device-1',
  getSiteOrigin: () => 'studio.acedata.cloud',
  getLastSeenAt: () => undefined,
  setLastSeenAt: vi.fn()
}));
vi.mock('./api', () => ({
  api: {
    listLocalTasks: mocks.listLocalTasks,
    claimRun: mocks.claimRun,
    finishRun: mocks.finishRun
  },
  UnauthorizedError: class UnauthorizedError extends Error {}
}));
vi.mock('./runner', () => ({ executeRun: mocks.executeRun }));

import { SchedulerDaemon } from './daemon';

describe('local scheduled run now', () => {
  it('returns the reserved conversation before the agent finishes', async () => {
    mocks.listLocalTasks.mockResolvedValue({
      items: [
        {
          id: 'task-1',
          name: 'Local task',
          schedule: { type: 'interval', interval_seconds: 3600, tz: 'UTC' },
          state: 'enabled',
          updated_at: 1
        }
      ]
    });
    mocks.claimRun.mockResolvedValue({
      run_id: 'run-1',
      conversation_id: 'run-1',
      question: 'Do the work',
      model: 'gpt-6.1-sol'
    });
    let finishAgent!: (value: { conversationId: string; answer: string }) => void;
    mocks.executeRun.mockReturnValue(
      new Promise((resolve) => {
        finishAgent = resolve;
      })
    );
    mocks.finishRun.mockResolvedValue({ status: 'success' });
    const daemon = new SchedulerDaemon();

    await expect(daemon.runNow('task-1')).resolves.toEqual({ ok: true, conversation_id: 'run-1' });
    await expect(daemon.runNow('task-1')).resolves.toEqual({ ok: false, reason: 'already_running' });

    finishAgent({ conversationId: 'run-1', answer: 'Done' });
    await vi.waitFor(() =>
      expect(mocks.finishRun).toHaveBeenCalledWith(
        expect.objectContaining({ run_id: 'run-1', conversation_id: 'run-1' }),
        'studio.acedata.cloud'
      )
    );
  });
});
