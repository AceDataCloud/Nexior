import { beforeEach, describe, expect, it, vi } from 'vitest';
const { get, post, del } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), del: vi.fn() }));
vi.mock('./common', () => ({ httpClient: { get, post, delete: del } }));
vi.mock('@/utils/baseUrl', () => ({ getBaseUrlAuth: () => 'https://auth.example' }));
import { connectionRuntime } from './connectionRuntime';
beforeEach(() => {
  get.mockReset();
  post.mockReset();
  del.mockReset();
});
describe('explicit connection authorization', () => {
  it('lists policy-backed owned accounts without credentials', async () => {
    get.mockResolvedValue({
      data: {
        connections: [
          {
            connection_id: 'c',
            connector_identifier: 'github/github',
            label: 'Work',
            runtime_auth: { routes: [{ method: 'GET', origin: 'https://api.github.com', path_prefix: '/user/repos' }] }
          }
        ]
      }
    });
    expect(await connectionRuntime.options()).toEqual([
      expect.objectContaining({ connection_id: 'c', permissions: ['GET api.github.com/user/repos'] })
    ]);
    expect(get.mock.calls[0][0]).toBe('/connections/runtime-options/');
  });
  it('creates a user-authenticated grant only for selected IDs and revokes it', async () => {
    post.mockResolvedValue({ data: { grant_id: 'g', ticket: 'opaque', expires_at: 'later' } });
    del.mockResolvedValue({});
    const grant = await connectionRuntime.create('app', 'cred', ['selected']);
    expect(post).toHaveBeenCalledWith(
      '/connections/runtime-grants/',
      { application_id: 'app', credential_id: 'cred', connection_ids: ['selected'], duration_seconds: 600 },
      { baseURL: 'https://auth.example/api/v1' }
    );
    await connectionRuntime.revoke(grant.grant_id);
    expect(del.mock.calls[0][0]).toBe('/connections/runtime-grants/g/');
  });
});
