import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getMe: vi.fn(), updateMe: vi.fn() }));
vi.mock('@/operators/user', () => ({ userOperator: mocks }));

import { syncedX402TaskIds, syncX402TaskId } from './taskSync';

describe('x402 task cloud sync', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads service-scoped task IDs without exposing other metadata', () => {
    const user = {
      metadata: {
        locale: 'en',
        x402_tasks: { nanobanana: ['nano-1'], openaiimage: ['openai-1'] }
      }
    };
    expect(syncedX402TaskIds(user, 'nanobanana')).toEqual(['nano-1']);
    expect(syncedX402TaskIds(user, 'openaiimage')).toEqual(['openai-1']);
  });

  it('merges the latest cloud metadata before updating the task list', async () => {
    const latest = {
      id: 'user-1',
      nickname: 'Ace',
      metadata: { locale: 'zh-CN', x402_tasks: { nanobanana: ['old-task'] } }
    };
    mocks.getMe.mockResolvedValue({ data: latest });
    mocks.updateMe.mockImplementation(async (payload) => ({ data: payload }));

    const updated = await syncX402TaskId('nanobanana', 'new-task');

    expect(mocks.updateMe).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        metadata: {
          locale: 'zh-CN',
          x402_tasks: { nanobanana: ['new-task', 'old-task'] }
        }
      })
    );
    expect(syncedX402TaskIds(updated, 'nanobanana')).toEqual(['new-task', 'old-task']);
  });
});
