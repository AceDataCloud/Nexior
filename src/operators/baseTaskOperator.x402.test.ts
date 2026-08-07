import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  postWithX402: vi.fn()
}));

vi.mock('axios', () => ({ default: { post: mocks.post } }));
vi.mock('./x402', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./x402')>();
  return { ...actual, postWithX402: mocks.postWithX402 };
});

import { BaseTaskOperator } from './baseTaskOperator';

const operator = new BaseTaskOperator<Record<string, unknown>, Record<string, unknown>, unknown, unknown>({
  generatePath: '/provider/images',
  tasksPath: '/provider/tasks'
});

describe('BaseTaskOperator payment mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the existing Credits generate path unchanged', async () => {
    mocks.post.mockResolvedValueOnce({ data: { task_id: 'credit-task' } });

    await operator.generate({ async: true }, { token: 'credential-token' });

    expect(mocks.postWithX402).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledWith(
      '/provider/images',
      { async: true },
      expect.objectContaining({
        baseURL: 'https://api.acedata.cloud',
        headers: expect.objectContaining({ authorization: 'Bearer credential-token' })
      })
    );
  });

  it('uses the same generate method for x402 mode', async () => {
    const x402 = { wallet: {} as any, confirm: vi.fn() };
    mocks.postWithX402.mockResolvedValueOnce({ data: { task_id: 'wallet-task' } });

    await operator.generate({ async: true }, { mode: 'x402', x402 });

    expect(mocks.postWithX402).toHaveBeenCalledWith(
      '/provider/images',
      { async: true },
      x402,
      expect.objectContaining({ accept: 'application/x-ndjson' })
    );
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('polls known wallet task IDs directly without another payment', async () => {
    mocks.post.mockResolvedValueOnce({ data: { items: [] } });

    await operator.tasks({ ids: ['wallet-task'] }, { mode: 'x402' });

    expect(mocks.postWithX402).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledWith(
      '/provider/tasks',
      { action: 'retrieve_batch', ids: ['wallet-task'] },
      expect.objectContaining({
        baseURL: 'https://x402.acedata.cloud',
        headers: { accept: 'application/json', 'content-type': 'application/json' }
      })
    );
  });
});
