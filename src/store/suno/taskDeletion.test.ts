import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'vuex';
import state from './state';
import mutations from './mutations';

const mocks = vi.hoisted(() => ({ tasks: vi.fn(), delete: vi.fn() }));
vi.mock('@/operators', () => ({
  applicationOperator: {},
  credentialOperator: {},
  sunoOperator: mocks,
  serviceOperator: {}
}));
import { deleteTask, getTasks } from './actions';

const pair = () => ({ id: 'generation-1', response: { data: [{ id: 'a' }, { id: 'b' }] } });
const other = () => ({ id: 'generation-2', response: { data: [{ id: 'c' }] } });
function makeStore() {
  const store = createStore<any>({
    state: { user: { id: 'owner' } },
    modules: { suno: { namespaced: true, state, mutations, actions: { deleteTask, getTasks } } }
  });
  store.commit('suno/setCredential', { token: 'test-token' });
  store.commit('suno/setTasks', { items: [pair(), other()], total: 2 });
  return store;
}

describe('Suno shared task deletion', () => {
  beforeEach(() => vi.clearAllMocks());
  it('removes the entire generation, preserves other tasks, and stays removed on history reload', async () => {
    mocks.delete.mockResolvedValue({ data: { deleted: true } });
    const store = makeStore();
    await store.dispatch('suno/deleteTask', { id: 'generation-1' });
    expect(mocks.delete).toHaveBeenCalledWith('generation-1', { token: 'test-token', userId: 'owner' });
    expect(store.state.suno.tasks.items).toEqual([other()]);
    expect(store.state.suno.tasks.total).toBe(1);
    mocks.tasks.mockResolvedValue({ data: { items: [other()], count: 1 } });
    await store.dispatch('suno/getTasks', { replace: true });
    expect(store.state.suno.tasks.items).toEqual([other()]);
  });
  it.each(['offline', 'not-deleted'])('rolls back the complete task on %s', async (failure) => {
    if (failure === 'offline') mocks.delete.mockRejectedValue(new Error('offline'));
    else mocks.delete.mockResolvedValue({ data: { deleted: false } });
    const store = makeStore();
    await expect(store.dispatch('suno/deleteTask', { id: 'generation-1' })).rejects.toThrow();
    expect(store.state.suno.tasks.items).toEqual([pair(), other()]);
    expect(store.state.suno.tasks.total).toBe(2);
  });
});
