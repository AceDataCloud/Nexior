// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }));
const siteOrigin = vi.hoisted(() => vi.fn(() => 'https://studio.zhishuyun.com'));

vi.mock('./common', () => ({ httpClient: http }));
vi.mock('@/utils/baseUrl', () => ({
  getBaseUrlAuth: () => 'https://auth.acedata.cloud'
}));
vi.mock('@/utils/authHandoff', () => ({
  getConnectorSiteOrigin: siteOrigin
}));

import { connectionOperator } from './connection';

describe('Connection OAuth site handoff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds the current web origin to catalog installs', async () => {
    http.post.mockResolvedValue({ data: { type: 'redirect' } });
    await connectionOperator.installFromCatalog('catalog-1', { return_url: 'https://auth.acedata.cloud/close' });
    expect(http.post.mock.calls[0][1]).toEqual({
      return_url: 'https://auth.acedata.cloud/close',
      site_origin: 'https://studio.zhishuyun.com'
    });
  });

  it('adds the current web origin to custom OAuth starts', async () => {
    http.post.mockResolvedValue({ data: {} });
    await connectionOperator.authorizeCustom({ server_url: 'https://mcp.example.com/mcp' });
    expect(http.post.mock.calls[0][1]).toEqual({
      server_url: 'https://mcp.example.com/mcp',
      site_origin: 'https://studio.zhishuyun.com'
    });
  });

  it('does not overwrite an explicit site origin', async () => {
    http.post.mockResolvedValue({ data: {} });
    await connectionOperator.authorize({ provider: 'google', site_origin: 'https://tenant.example.com' });
    expect(http.post.mock.calls[0][1].site_origin).toBe('https://tenant.example.com');
  });
});
