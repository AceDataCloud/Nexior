import { AxiosError, CanceledError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapSite, readBootstrapSite } from './siteBootstrap';

const site = { id: 'site-1', origin: 'studio.example.com', admins: ['owner'] };
const httpError = (status: number) =>
  new AxiosError('Request failed', undefined, undefined, undefined, { status } as any);

describe('site bootstrap recovery', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('recovers from a refused connection and a transient 502', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockRejectedValueOnce(httpError(502))
      .mockResolvedValue(site);
    const result = readBootstrapSite(load);
    await vi.runAllTimersAsync();
    await expect(result).resolves.toBe(site);
    expect(load.mock.calls).toEqual([[5000], [5000], [5000]]);
  });

  it.each([400, 401, 403, 404, 429, 500])('does not retry HTTP %s', async (status) => {
    const error = httpError(status);
    const load = vi.fn().mockRejectedValue(error);
    await expect(readBootstrapSite(load)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not retry a canceled request', async () => {
    const error = new CanceledError();
    const load = vi.fn().mockRejectedValue(error);
    await expect(readBootstrapSite(load)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not retry Axios configuration errors', async () => {
    const error = new AxiosError('bad option', 'ERR_BAD_OPTION_VALUE');
    const load = vi.fn().mockRejectedValue(error);
    await expect(readBootstrapSite(load)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('stops after four fast failures', async () => {
    const error = httpError(503);
    const load = vi.fn().mockRejectedValue(error);
    const result = expect(readBootstrapSite(load)).rejects.toBe(error);
    await vi.runAllTimersAsync();
    await result;
    expect(load).toHaveBeenCalledTimes(4);
  });

  it('caps slow requests and backoff together at 15 seconds', async () => {
    const start = Date.now();
    const load = vi.fn(
      (timeout: number) =>
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new AxiosError('timeout', 'ECONNABORTED')), timeout);
        })
    );
    const result = expect(readBootstrapSite(load)).rejects.toMatchObject({ code: 'ECONNABORTED' });
    await vi.runAllTimersAsync();
    await result;
    expect(Date.now() - start).toBe(15000);
    expect(load.mock.calls).toEqual([[5000], [5000], [2000]]);
  });

  it('never initializes a site after a failed lookup, even when signed in', async () => {
    const initializeSite = vi.fn();
    const result = expect(
      bootstrapSite({
        getSite: vi.fn().mockRejectedValue(httpError(502)),
        initializeSite,
        isAuthenticated: () => true
      })
    ).rejects.toMatchObject({ response: { status: 502 } });
    await vi.runAllTimersAsync();
    await result;
    expect(initializeSite).not.toHaveBeenCalled();
  });

  it('does not create a missing site for a guest', async () => {
    const initializeSite = vi.fn();
    await expect(
      bootstrapSite({
        getSite: vi.fn().mockResolvedValue(undefined),
        initializeSite,
        isAuthenticated: () => false
      })
    ).rejects.toThrow('Site configuration unavailable');
    expect(initializeSite).not.toHaveBeenCalled();
  });

  it('keeps authenticated setup after a successful empty lookup', async () => {
    const initializeSite = vi.fn().mockResolvedValue(site);
    await expect(
      bootstrapSite({
        getSite: vi.fn().mockResolvedValue(undefined),
        initializeSite,
        isAuthenticated: () => true
      })
    ).resolves.toBe(site);
    expect(initializeSite).toHaveBeenCalledExactlyOnceWith(5000);
  });

  it('never retries setup writes after an ambiguous failure', async () => {
    const initializeSite = vi.fn().mockRejectedValue(httpError(502));
    await expect(
      bootstrapSite({
        getSite: vi.fn().mockResolvedValue({ ...site, admins: [] }),
        initializeSite,
        isAuthenticated: () => true
      })
    ).rejects.toMatchObject({ response: { status: 502 } });
    expect(initializeSite).toHaveBeenCalledTimes(1);
  });
});
