import { describe, expect, it, vi } from 'vitest';
import { createTaskActions } from './createTaskActions';

// Minimal harness: invoke a single action from the bundle with a fake context.
const invoke = async (
  action: unknown,
  ctx: { state?: any; rootState?: any; commits?: Array<[string, unknown]> },
  payload?: unknown
) => {
  const commits = ctx.commits ?? [];
  const context = {
    state: ctx.state ?? {},
    rootState: ctx.rootState ?? {},
    commit: (type: string, p: unknown) => commits.push([type, p])
  };
  return (action as (c: unknown, p: unknown) => Promise<unknown>)(context, payload);
};

const makeActions = (operator: any) =>
  createTaskActions<unknown, { id: string }, Record<string, unknown>>({
    serviceId: 'svc-1',
    operator
  });

describe('createTaskActions/deleteTask', () => {
  it('optimistically removes the task and calls the operator with id + user_id', async () => {
    const del = vi.fn().mockResolvedValue({ data: { id: 'b', deleted: true } });
    const actions: any = makeActions({ tasks: vi.fn(), delete: del });
    const commits: Array<[string, unknown]> = [];
    const state = {
      credential: { token: 'tok' },
      tasks: { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], total: 3 }
    };

    await invoke(actions.deleteTask, { state, rootState: { user: { id: 'user-1' } }, commits }, { id: 'b' });

    // Card + total updated BEFORE the request resolves (optimistic).
    expect(commits[0]).toEqual(['setTasksItems', [{ id: 'a' }, { id: 'c' }]]);
    expect(commits[1]).toEqual(['setTasksTotal', 2]);
    expect(del).toHaveBeenCalledWith('b', { token: 'tok', userId: 'user-1' });
  });

  it('rolls back the list and rethrows when the server reports deleted:false', async () => {
    // Skip-auth worker answers 200 even when nothing matched (foreign/blank
    // user_id) — the card must NOT stay dropped.
    const del = vi.fn().mockResolvedValue({ data: { id: 'a', deleted: false } });
    const actions: any = makeActions({ tasks: vi.fn(), delete: del });
    const commits: Array<[string, unknown]> = [];
    const items = [{ id: 'a' }, { id: 'b' }];
    const state = { credential: { token: 'tok' }, tasks: { items, total: 2 } };

    await expect(
      invoke(actions.deleteTask, { state, rootState: { user: { id: 'u' } }, commits }, 'a')
    ).rejects.toThrow();

    expect(commits).toEqual([
      ['setTasksItems', [{ id: 'b' }]],
      ['setTasksTotal', 1],
      ['setTasksItems', items],
      ['setTasksTotal', 2]
    ]);
  });

  it('rolls back the list and rethrows when the delete fails', async () => {
    const del = vi.fn().mockRejectedValue(new Error('network'));
    const actions: any = makeActions({ tasks: vi.fn(), delete: del });
    const commits: Array<[string, unknown]> = [];
    const items = [{ id: 'a' }, { id: 'b' }];
    const state = { credential: { token: 'tok' }, tasks: { items, total: 2 } };

    await expect(invoke(actions.deleteTask, { state, rootState: { user: { id: 'u' } }, commits }, 'a')).rejects.toThrow(
      'network'
    );

    // optimistic remove, then rollback to the original snapshot.
    expect(commits).toEqual([
      ['setTasksItems', [{ id: 'b' }]],
      ['setTasksTotal', 1],
      ['setTasksItems', items],
      ['setTasksTotal', 2]
    ]);
  });

  it('is a no-op when no id is supplied', async () => {
    const del = vi.fn();
    const actions: any = makeActions({ tasks: vi.fn(), delete: del });
    const commits: Array<[string, unknown]> = [];

    await invoke(actions.deleteTask, { state: { credential: { token: 't' }, tasks: { items: [] } }, commits }, {});

    expect(del).not.toHaveBeenCalled();
    expect(commits).toEqual([]);
  });

  it('throws without touching the list when the operator cannot delete', async () => {
    const actions: any = makeActions({ tasks: vi.fn() }); // no delete()
    const commits: Array<[string, unknown]> = [];
    const state = { credential: { token: 't' }, tasks: { items: [{ id: 'a' }], total: 1 } };

    await expect(invoke(actions.deleteTask, { state, rootState: {}, commits }, 'a')).rejects.toThrow();
    expect(commits).toEqual([]);
  });
});
