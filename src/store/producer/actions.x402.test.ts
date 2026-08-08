import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tasks: vi.fn() }));
vi.mock('@/operators', () => ({
  applicationOperator: {},
  credentialOperator: {},
  producerOperator: { tasks: mocks.tasks },
  serviceOperator: {}
}));

import { getTasks } from './actions';

const state = () => ({ credential: { token: 'credits-token' }, tasks: { items: [], total: 0 } }) as any;
const context = (value = state()) => ({ state: value, rootState: { user: { id: 'user-1' } }, commit: vi.fn() }) as any;

describe('Producer x402 history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps Credits history scoped to the user', async () => {
    mocks.tasks.mockResolvedValueOnce({ data: { items: [], count: 0 } });
    const ctx = context();
    await getTasks(ctx, { limit: 5 });
    expect(mocks.tasks).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', type: 'audios' }), {
      token: 'credits-token'
    });
  });

  it('queries guest history only by in-memory IDs', async () => {
    mocks.tasks.mockResolvedValueOnce({ data: { items: [], count: 0 } });
    const ctx = context({ ...state(), credential: undefined });
    await getTasks(ctx, { mode: 'x402', ids: ['task-1'] });
    expect(mocks.tasks).toHaveBeenCalledWith(expect.objectContaining({ ids: ['task-1'], type: 'audios' }), {
      mode: 'x402'
    });
  });

  it('does not send an empty guest history request', async () => {
    const ctx = context({ ...state(), credential: undefined });
    await getTasks(ctx, { mode: 'x402', ids: [] });
    expect(mocks.tasks).not.toHaveBeenCalled();
    expect(ctx.commit).toHaveBeenCalledWith('setTasksTotal', 0);
  });
});
