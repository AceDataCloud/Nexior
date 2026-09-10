import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

const publicGet = vi.fn();
const optionalGet = vi.fn();
const authState = { authenticated: false, user: undefined as { id: string } | undefined };
vi.mock('axios', () => ({ default: { create: vi.fn(() => ({ get: publicGet })) } }));
vi.mock('@/utils/baseUrl', () => ({ getBaseUrlPlatform: () => 'https://platform.example.com' }));
vi.mock('@/store', () => ({
  default: {
    getters: new Proxy(
      {},
      {
        get: (_target, key) => authState[key as keyof typeof authState]
      }
    )
  }
}));
vi.mock('./common', () => ({ optionalHttpClient: { get: optionalGet } }));

const { showcaseOperator } = await import('./showcase');

describe('showcaseOperator', () => {
  beforeEach(() => {
    publicGet.mockReset();
    optionalGet.mockReset();
    authState.authenticated = false;
    authState.user = undefined;
    showcaseOperator.clearCache();
  });

  it('uses a standalone anonymous client without shared telemetry', () => {
    expect(axios.create).toHaveBeenCalledWith({ baseURL: 'https://platform.example.com/api/v1', timeout: 10000 });
  });

  it('loads the complete list or exact service filter', async () => {
    publicGet.mockResolvedValue({ data: [] });
    await showcaseOperator.list();
    expect(publicGet).toHaveBeenCalledWith('/showcases/', {
      headers: { 'Accept-Language': 'en' },
      params: undefined
    });
    showcaseOperator.clearCache();
    await showcaseOperator.list('seedance', 'zh-CN');
    expect(publicGet).toHaveBeenLastCalledWith('/showcases/', {
      headers: { 'Accept-Language': 'zh-cn' },
      params: { service: 'seedance' }
    });
  });

  it('isolates cache entries by locale and authenticated identity', async () => {
    publicGet.mockResolvedValue({ data: [] });
    optionalGet.mockResolvedValue({ data: [] });
    await showcaseOperator.list('seedance', 'en');
    await showcaseOperator.list('seedance', 'zh-CN');
    await showcaseOperator.list('seedance', 'en');
    expect(publicGet).toHaveBeenCalledTimes(2);

    authState.authenticated = true;
    authState.user = { id: 'holder-1' };
    await showcaseOperator.list('seedance', 'en');
    await showcaseOperator.list('seedance', 'en');
    expect(optionalGet).toHaveBeenCalledTimes(1);

    authState.user = { id: 'holder-2' };
    await showcaseOperator.list('seedance', 'en');
    expect(optionalGet).toHaveBeenCalledTimes(2);
  });

  it('expires successful cache entries after the server cache window', async () => {
    vi.useFakeTimers();
    publicGet.mockResolvedValue({ data: [] });
    await showcaseOperator.list('seedance');
    await showcaseOperator.list('seedance');
    expect(publicGet).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_001);
    await showcaseOperator.list('seedance');
    expect(publicGet).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('deduplicates identical list requests and clears failed promises', async () => {
    publicGet.mockResolvedValue({ data: [] });
    const first = showcaseOperator.list('nano-banana');
    const second = showcaseOperator.list('nano-banana');
    expect(first).toBe(second);
    await first;
    expect(publicGet).toHaveBeenCalledTimes(1);

    showcaseOperator.clearCache();
    publicGet.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: [] });
    await showcaseOperator.list('seedance').catch(() => undefined);
    await showcaseOperator.list('seedance');
    expect(publicGet).toHaveBeenCalledTimes(3);
  });
});
