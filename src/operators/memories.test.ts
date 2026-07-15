import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoriesOperator } from './memories';

vi.mock('@/utils', () => ({ currentSiteOrigin: () => '' }));

afterEach(() => vi.restoreAllMocks());

describe('memoriesOperator', () => {
  it('loads entries and the account preference', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [{ id: 'm1' }], enabled: false } });

    await expect(memoriesOperator.getProfile('token')).resolves.toMatchObject({
      items: [{ id: 'm1' }],
      enabled: false
    });
  });

  it('defaults legacy profiles to enabled', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [] } });

    await expect(memoriesOperator.getProfile('token')).resolves.toEqual({ items: [], enabled: true });
  });

  it('persists the account preference', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { enabled: false } });

    await expect(memoriesOperator.setEnabled('token', false)).resolves.toBe(false);
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/aichat2/memories'),
      { action: 'set_enabled', enabled: false },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) })
    );
  });
});
