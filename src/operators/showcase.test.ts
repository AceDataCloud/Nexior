import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

const get = vi.fn();
vi.mock('axios', () => ({ default: { create: vi.fn(() => ({ get })) } }));
vi.mock('@/utils/baseUrl', () => ({ getBaseUrlPlatform: () => 'https://platform.example.com' }));

const { showcaseOperator } = await import('./showcase');

describe('showcaseOperator', () => {
  beforeEach(() => {
    get.mockReset();
    showcaseOperator.clearCache();
  });

  it('uses a standalone anonymous client without shared telemetry', () => {
    expect(axios.create).toHaveBeenCalledWith({ baseURL: 'https://platform.example.com/api/v1', timeout: 10000 });
  });

  it('loads the complete list or exact service filter', async () => {
    get.mockResolvedValue({ data: [] });
    await showcaseOperator.list();
    expect(get).toHaveBeenCalledWith('/showcases/', undefined);
    showcaseOperator.clearCache();
    await showcaseOperator.list('seedance');
    expect(get).toHaveBeenLastCalledWith('/showcases/', { params: { service: 'seedance' } });
  });

  it('expires successful cache entries after the server cache window', async () => {
    vi.useFakeTimers();
    get.mockResolvedValue({ data: [] });
    await showcaseOperator.list('seedance');
    await showcaseOperator.list('seedance');
    expect(get).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_001);
    await showcaseOperator.list('seedance');
    expect(get).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('deduplicates identical list requests and clears failed promises', async () => {
    get.mockResolvedValue({ data: [] });
    const first = showcaseOperator.list('nano-banana');
    const second = showcaseOperator.list('nano-banana');
    expect(first).toBe(second);
    await first;
    expect(get).toHaveBeenCalledTimes(1);

    showcaseOperator.clearCache();
    get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: [] });
    await showcaseOperator.list('seedance').catch(() => undefined);
    await showcaseOperator.list('seedance');
    expect(get).toHaveBeenCalledTimes(3);
  });
});
