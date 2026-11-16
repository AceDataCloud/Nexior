import { beforeEach, describe, expect, it, vi } from 'vitest';
import actions from './actions';
import { acemusicOperator } from '@/operators/acemusic';
vi.mock('@/operators/acemusic', () => ({ acemusicOperator: { tasks: vi.fn() } }));
vi.mock('@/operators', () => ({ applicationOperator: {}, credentialOperator: {}, serviceOperator: {} }));
describe('ACE Music history isolation and recovery', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does not repopulate history when the selected application changes during a request', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(acemusicOperator.tasks).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }) as any
    );
    const state = { credential: { token: 'first' }, status: {}, tasks: { items: [] } };
    const commit = vi.fn();
    const pending = actions.getTasks({ state, commit });
    state.credential.token = 'second';
    resolve({ data: { count: 1, items: [{ id: 'private' }] } });
    await pending;
    expect(commit).not.toHaveBeenCalled();
  });
  it('updates intermediate track delivery while keeping the original task identity', async () => {
    const state = {
      credential: { token: 'first' },
      tasks: { items: [{ id: 'same-task', state: 'processing', created_at: 1 }] }
    };
    const updated = {
      id: 'same-task',
      state: 'storing',
      created_at: 1,
      response: { data: [{ id: 'track-1', audio_url: 'https://example.com/1.mp3' }] }
    };
    vi.mocked(acemusicOperator.tasks).mockResolvedValue({ data: { count: 1, items: [updated] } } as any);
    const commit = vi.fn();
    await actions.refreshPendingTasks({ state, commit });
    expect(acemusicOperator.tasks).toHaveBeenCalledWith({ ids: ['same-task'] }, { token: 'first' });
    expect(commit).toHaveBeenCalledWith('setTasksItems', [updated]);
  });
});
