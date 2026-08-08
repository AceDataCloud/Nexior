import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const mocks = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock('@/operators/serp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/operators/serp')>()),
  serpOperator: { search: mocks.search }
}));

import { search } from './actions';

const state = () =>
  ({
    credential: { token: 'credits-token' },
    config: { query: '  ace data  ', type: 'search', number: 10 },
    results: undefined,
    status: { search: Status.None }
  }) as any;

const context = (value = state()) => ({ state: value, commit: vi.fn() }) as any;

describe('SERP x402 search action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the existing credential path and normalized request', async () => {
    mocks.search.mockResolvedValueOnce({ data: { organic: [] } });
    const ctx = context();

    await search(ctx);

    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'ace data', type: 'search', number: 10 }),
      { token: 'credits-token' }
    );
    expect(ctx.state.status.search).toBe(Status.Success);
    expect(ctx.commit).toHaveBeenCalledWith('setResults', { organic: [] });
  });

  it('allows guest wallet search options without a credential', async () => {
    mocks.search.mockResolvedValueOnce({ data: { images: [] } });
    const ctx = context({ ...state(), credential: undefined });
    const options = { mode: 'x402' as const, x402: { wallet: {} as never, confirm: async () => true } };

    await search(ctx, options);

    expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({ query: 'ace data' }), options);
  });

  it('preserves error state and rethrows failures to the page', async () => {
    const error = new Error('search failed');
    mocks.search.mockRejectedValueOnce(error);
    const ctx = context();

    await expect(search(ctx)).rejects.toBe(error);
    expect(ctx.state.status.search).toBe(Status.Error);
    expect(ctx.commit).toHaveBeenCalledWith('setResults', undefined);
  });
});
