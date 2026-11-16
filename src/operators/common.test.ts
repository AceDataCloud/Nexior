import { AxiosError, type AxiosAdapter, type AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  token: undefined as string | undefined,
  login: vi.fn(),
  reauthenticate: vi.fn(),
  logout: vi.fn()
}));

vi.mock('@/store', () => ({
  default: {
    get getters() {
      return {
        token: { access: state.token },
        authenticated: !!state.token,
        user: {},
        fingerprint: undefined
      };
    },
    get state() {
      return { token: { access: state.token } };
    },
    dispatch: (action: string) => (action === 'logout' ? state.logout() : state.login())
  }
}));

vi.mock('@/utils/login', () => ({
  requestReauthentication: state.reauthenticate,
  ensureLoggedIn: () => {
    state.login();
    return false;
  }
}));
vi.mock('@/utils/baseUrl', () => ({ getBaseUrlPlatform: () => 'https://platform.acedata.cloud' }));
vi.mock('@/plugins/telemetry', () => ({ trackApiFailure: vi.fn() }));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn() }));

import { anonymousHttpClient, httpClient, optionalHttpClient } from './common';
import { AuthRequiredError, configureRequestAuth } from '@/utils/requestAuth';

const adapter =
  (send: (config: unknown) => void): AxiosAdapter =>
  async (config) => {
    send(config);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };

const unauthorizedAdapter: AxiosAdapter = async (config) => {
  throw new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    data: {},
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config
  });
};

const run = (client: typeof httpClient, config: AxiosRequestConfig = {}) => {
  const send = vi.fn();
  client.defaults.adapter = adapter(send);
  return { promise: client.get('/resource', config), send };
};

beforeEach(() => {
  state.token = undefined;
  state.login.mockClear();
  state.logout.mockClear();
  state.reauthenticate.mockClear();
  configureRequestAuth({
    getAccountToken: () => state.token,
    isAuthenticated: () => !!state.token,
    triggerLogin: state.login
  });
});

describe('Platform HTTP auth modes', () => {
  const forbidden =
    (code: string, send = vi.fn()): AxiosAdapter =>
    async (config) => {
      send(config);
      throw new AxiosError('forbidden', 'ERR_BAD_REQUEST', config, undefined, {
        data: { code },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config
      });
    };

  it('starts fresh authentication without replaying the rejected mutation', async () => {
    state.token = 'stale-session';
    const send = vi.fn();
    httpClient.defaults.adapter = forbidden('reauthentication_required', send);
    await expect(httpClient.post('/browser-devices/pairing-challenges/', {})).rejects.toMatchObject({
      response: { status: 403, data: { code: 'reauthentication_required' } }
    });
    expect(send).toHaveBeenCalledOnce();
    expect(state.reauthenticate).toHaveBeenCalledOnce();
    expect(state.logout).not.toHaveBeenCalled();
  });

  it('keeps unrelated permission failures non-interactive', async () => {
    state.token = 'session';
    httpClient.defaults.adapter = forbidden('permission_denied');
    await expect(httpClient.get('/resource')).rejects.toMatchObject({ response: { status: 403 } });
    expect(state.reauthenticate).not.toHaveBeenCalled();
  });

  it.each([optionalHttpClient, anonymousHttpClient])(
    'does not reauthenticate a non-required client',
    async (client) => {
      client.defaults.adapter = forbidden('reauthentication_required');
      await expect(client.get('/resource')).rejects.toMatchObject({ response: { status: 403 } });
      expect(state.reauthenticate).not.toHaveBeenCalled();
    }
  );

  it('blocks required requests before the adapter and starts login', async () => {
    const { promise, send } = run(httpClient);
    await expect(promise).rejects.toBeInstanceOf(AuthRequiredError);
    expect(send).not.toHaveBeenCalled();
    expect(state.login).toHaveBeenCalledOnce();
  });

  it('allows optional guest requests without Authorization', async () => {
    const { promise, send } = run(optionalHttpClient);
    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(send.mock.calls[0][0].headers.get('Authorization')).toBeUndefined();
    expect(state.login).not.toHaveBeenCalled();
  });

  it('adds the account token to optional requests when signed in', async () => {
    state.token = 'account-token';
    const { promise, send } = run(optionalHttpClient);
    await promise;
    expect(send.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer account-token');
  });

  it('never adds the account token to anonymous requests', async () => {
    state.token = 'account-token';
    const { promise, send } = run(anonymousHttpClient);
    await promise;
    expect(send.mock.calls[0][0].headers.get('Authorization')).toBeUndefined();
  });

  it('logs out an authenticated required request on 401', async () => {
    state.token = 'expired-token';
    httpClient.defaults.adapter = unauthorizedAdapter;
    await expect(httpClient.get('/protected')).rejects.toMatchObject({ response: { status: 401 } });
    expect(state.logout).toHaveBeenCalledOnce();
    expect(state.login).not.toHaveBeenCalled();
  });

  it.each([optionalHttpClient, anonymousHttpClient])(
    'keeps non-required 401 responses non-interactive',
    async (client) => {
      client.defaults.adapter = unauthorizedAdapter;
      await expect(client.get('/public')).rejects.toMatchObject({ response: { status: 401 } });
      expect(state.login).not.toHaveBeenCalled();
      expect(state.logout).not.toHaveBeenCalled();
    }
  );
});
