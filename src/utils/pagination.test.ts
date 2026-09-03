import { describe, expect, it, vi } from 'vitest';
import { loadPreviousPage } from './pagination';

describe('loadPreviousPage', () => {
  it('does not fetch after the server marks history exhausted', async () => {
    const fetch = vi.fn();

    await loadPreviousPage({
      tasks: { items: [{ created_at: 1 }], hasMore: false },
      loading: false,
      setLoading: vi.fn(),
      fetch
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
