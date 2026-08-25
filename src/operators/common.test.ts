import { AxiosError, type AxiosAdapter, type AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  token: undefined as string | undefined,
  login: vi.fn(),
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
  configureRequestAuth({
    getAccountToken: () => state.token,
    isAuthenticated: () => !!state.token,
    triggerLogin: state.login
  });
});

describe('Platform HTTP auth modes', () => {
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
