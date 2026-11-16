import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the SSO operator + telemetry so the util is exercised in isolation.
const tokenMock = vi.fn();
vi.mock('@/operators', () => ({
  ssoOperator: { token: (...args: unknown[]) => tokenMock(...args) }
}));
vi.mock('@/plugins/telemetry', () => ({ track: vi.fn() }));

import { exchangeSsoCode } from './exchangeSsoCode';

function makeCtx(source: 'native' | 'desktop' = 'desktop') {
  const dispatch = vi.fn().mockResolvedValue(undefined);
  const commit = vi.fn();
  const push = vi.fn().mockResolvedValue(undefined);
  const store = {
    dispatch,
    commit,
    state: { site: { origin: 'studio.acedata.cloud' }, auth: { reauthenticate: false, redirect: '/' } }
  };
  const router = { push };
  return { store: store as never, router: router as never, source, dispatch, commit, push, auth: store.state.auth };
}

describe('exchangeSsoCode', () => {
  beforeEach(() => {
    tokenMock.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges the code, sets the token, fetches the user, and routes home', async () => {
    tokenMock.mockResolvedValue({
      data: { access_token: 'acc', refresh_token: 'ref', expires_in: 3600 }
    });
    const ctx = makeCtx();
    await exchangeSsoCode('code-success-1', ctx);

    expect(tokenMock).toHaveBeenCalledWith({ code: 'code-success-1' });
    expect(ctx.dispatch).toHaveBeenCalledWith('setToken', {
      access: 'acc',
      refresh: 'ref',
      expiration: 3600
    });
    expect(ctx.dispatch).toHaveBeenCalledWith('getUser');
    expect(ctx.commit).toHaveBeenCalledWith('setAuth', { visible: false, reauthenticate: false });
    expect(ctx.push).toHaveBeenCalledWith('/');
  });

  it('dedups: the same code is not exchanged twice', async () => {
    tokenMock.mockResolvedValue({
      data: { access_token: 'a', refresh_token: 'r', expires_in: 1 }
    });
    const ctx = makeCtx();
    await exchangeSsoCode('code-dedup', ctx);
    await exchangeSsoCode('code-dedup', ctx); // second call must be a no-op

    expect(tokenMock).toHaveBeenCalledTimes(1);
  });

  it('on failure: dispatches login and allows a fresh (different) code to retry', async () => {
    tokenMock.mockRejectedValueOnce(new Error('boom'));
    const ctx = makeCtx();
    await exchangeSsoCode('code-fail', ctx);

    expect(ctx.commit).toHaveBeenCalledWith('setAuth', { visible: false });
    expect(ctx.dispatch).toHaveBeenCalledWith('login');

    // A NEW code must not be blocked by the failed one (dedup was reset).
    tokenMock.mockResolvedValue({
      data: { access_token: 'a2', refresh_token: 'r2', expires_in: 2 }
    });
    const ctx2 = makeCtx();
    await exchangeSsoCode('code-after-fail', ctx2);
    expect(ctx2.dispatch).toHaveBeenCalledWith('getUser');
  });

  it('ignores an empty code', async () => {
    const ctx = makeCtx();
    await exchangeSsoCode('', ctx);
    expect(tokenMock).not.toHaveBeenCalled();
  });

  it.each(['native', 'desktop'] as const)(
    'returns %s reauthentication to the safe app route without replay',
    async (source) => {
      tokenMock.mockResolvedValue({ data: { access_token: 'fresh', refresh_token: 'refresh', expires_in: 3600 } });
      const ctx = makeCtx(source);
      ctx.auth.reauthenticate = true;
      ctx.auth.redirect = '/console/connectors?connect=github&tab=mine#devices';
      await exchangeSsoCode(`reauth-${source}`, ctx);
      expect(ctx.push).toHaveBeenCalledWith('/console/connectors?tab=mine#devices');
      expect(ctx.commit).toHaveBeenCalledWith('setAuth', { visible: false, reauthenticate: false });
      expect(ctx.dispatch.mock.calls.map(([action]) => action)).toEqual(['setToken', 'getUser']);
    }
  );

  it('keeps the fresh-auth requirement when a code exchange fails', async () => {
    tokenMock.mockRejectedValue(new Error('expired code'));
    const ctx = makeCtx();
    ctx.auth.reauthenticate = true;
    ctx.auth.redirect = '/console/connectors';
    await exchangeSsoCode('failed-reauth', ctx);
    expect(ctx.dispatch).toHaveBeenCalledWith('login', { reauthenticate: true, redirect: '/console/connectors' });
  });
});
