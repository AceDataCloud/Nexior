import { describe, expect, it, vi } from 'vitest';

vi.mock('./common', () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

import { httpClient } from './common';
import { siteGithubOAuthOperator } from './siteGithubOAuth';

describe('siteGithubOAuthOperator', () => {
  it('uses dedicated secret-safe endpoints', async () => {
    await siteGithubOAuthOperator.get('site-id');
    await siteGithubOAuthOperator.update('site-id', { client_id: 'client', client_secret: 'secret' });
    await siteGithubOAuthOperator.remove('site-id');

    expect(httpClient.get).toHaveBeenCalledWith('/sites/site-id/auth-providers/github/');
    expect(httpClient.patch).toHaveBeenCalledWith('/sites/site-id/auth-providers/github/', {
      client_id: 'client',
      client_secret: 'secret'
    });
    expect(httpClient.delete).toHaveBeenCalledWith('/sites/site-id/auth-providers/github/');
  });
});
