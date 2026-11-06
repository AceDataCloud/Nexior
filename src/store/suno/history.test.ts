import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'vuex';
import state from './state';
import mutations from './mutations';

const mocks = vi.hoisted(() => ({ tasks: vi.fn(), deleteAudio: vi.fn() }));
vi.mock('@/operators', () => ({
  applicationOperator: {},
  credentialOperator: {},
  sunoOperator: mocks,
  serviceOperator: {}
}));
import { deleteAudio, getTasks } from './actions';

const pair = () => ({ id: 'pair', created_at: 1, response: { data: [{ id: 'a' }, { id: 'b' }] } });
function store() {
  const value = createStore<any>({
    state: { user: { id: 'owner' } },
    modules: { suno: { namespaced: true, state, mutations, actions: { deleteAudio, getTasks } } }
  });
  value.commit('suno/setCredential', { token: 'test-token' });
  value.commit('suno/setTasks', { items: [pair()], total: 1 });
  value.commit('suno/setAudio', { id: 'a' });
  return value;
}
const songs = (s: any) => s.state.suno.tasks.items.flatMap((t: any) => t.response.data.map((a: any) => a.id));

describe('Suno persistent history removal', () => {
  beforeEach(() => vi.clearAllMocks());
  it('keeps the song and playback until the server confirms, preserving its sibling', async () => {
    let acknowledge!: (value: any) => void;
    mocks.deleteAudio.mockReturnValue(
      new Promise((resolve) => {
        acknowledge = resolve;
      })
    );
    const s = store();
    const removal = s.dispatch('suno/deleteAudio', { taskId: 'pair', audioId: 'a' });
    expect(songs(s)).toEqual(['a', 'b']);
    expect((s.state as any).suno.audio.id).toBe('a');
    acknowledge({ data: { deleted: true } });
    await removal;
    expect(mocks.deleteAudio).toHaveBeenCalledWith('pair', 'a', { token: 'test-token' });
    expect(songs(s)).toEqual(['b']);
    expect((s.state as any).suno.audio).toBeUndefined();
    expect((s.state as any).suno.tasks.total).toBe(1);
  });
  it.each(['offline', 'unconfirmed'])('does not hide songs on %s', async (failure) => {
    if (failure === 'offline') mocks.deleteAudio.mockRejectedValue(new Error('offline'));
    else mocks.deleteAudio.mockResolvedValue({ data: {} });
    const s = store();
    await expect(s.dispatch('suno/deleteAudio', { taskId: 'pair', audioId: 'a' })).rejects.toThrow();
    expect(songs(s)).toEqual(['a', 'b']);
    expect((s.state as any).suno.audio.id).toBe('a');
  });
  it('filters a history response that was already in flight and removes an empty task', async () => {
    let respond!: (value: any) => void;
    mocks.tasks.mockReturnValue(
      new Promise((resolve) => {
        respond = resolve;
      })
    );
    mocks.deleteAudio.mockResolvedValue({ data: { deleted: true } });
    const s = store();
    const refresh = s.dispatch('suno/getTasks', { replace: true });
    await s.dispatch('suno/deleteAudio', { taskId: 'pair', audioId: 'a' });
    await s.dispatch('suno/deleteAudio', { taskId: 'pair', audioId: 'b' });
    respond({ data: { items: [pair()], count: 1 } });
    await refresh;
    expect(songs(s)).toEqual([]);
    expect((s.state as any).suno.tasks.total).toBe(0);
    s.commit('suno/setTasksItems', [pair()]);
    expect(songs(s)).toEqual([]);
    s.commit('suno/setTasksItems', [{ id: 'pair' }]);
    expect((s.state as any).suno.tasks.items).toEqual([]);
  });
  it('uses the server projection after a fresh session', async () => {
    mocks.tasks.mockResolvedValue({ data: { items: [{ ...pair(), response: { data: [{ id: 'b' }] } }], count: 1 } });
    const s = store();
    await s.dispatch('suno/getTasks', { replace: true });
    expect(songs(s)).toEqual(['b']);
  });
  it('rejects unauthenticated removal and resets session guards on logout', async () => {
    const s = store();
    s.commit('suno/removeAudio', { taskId: 'pair', audioId: 'a' });
    s.commit('suno/resetAll');
    expect((s.state as any).suno.removedAudioIds).toEqual({});
    await expect(s.dispatch('suno/deleteAudio', { taskId: 'pair', audioId: 'a' })).rejects.toThrow();
    expect(mocks.deleteAudio).not.toHaveBeenCalled();
  });
});
