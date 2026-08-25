import axios, { type AxiosAdapter, type AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  accountToken: undefined as string | undefined,
  ensureLoggedIn: vi.fn()
};

import {
  AuthRequiredError,
  CredentialNotReadyError,
  configureRequestAuth,
  installServiceRequestAuthGuard,
  requireAccountToken,
  requireServiceToken
} from './requestAuth';

const adapter =
  (send: (config: unknown) => void): AxiosAdapter =>
  async (config) => {
    send(config);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };

const request = (config: AxiosRequestConfig, send = vi.fn()) => {
  const client = axios.create();
  installServiceRequestAuthGuard(client);
  client.defaults.adapter = adapter(send);
  return { promise: client.request(config), send };
};

beforeEach(() => {
  auth.accountToken = undefined;
  auth.ensureLoggedIn.mockClear();
  configureRequestAuth({
    getAccountToken: () => auth.accountToken,
    isAuthenticated: () => !!auth.accountToken,
    triggerLogin: auth.ensureLoggedIn
  });
});

describe('request auth tokens', () => {
  it('starts login when an account token is required for a guest', () => {
    expect(() => requireAccountToken()).toThrow(AuthRequiredError);
    expect(auth.ensureLoggedIn).toHaveBeenCalledOnce();
  });

  it('distinguishes signed-in credential provisioning from signed-out auth', () => {
    auth.accountToken = 'account-token';
    expect(() => requireServiceToken(undefined)).toThrow(CredentialNotReadyError);
    expect(auth.ensureLoggedIn).not.toHaveBeenCalled();
  });

  it('returns a valid service credential unchanged', () => {
    expect(requireServiceToken('service-token')).toBe('service-token');
  });
});

describe('service API request guard', () => {
  it('blocks a guest API request before the adapter and starts login', async () => {
    const { promise, send } = request({
      baseURL: 'https://api.acedata.cloud',
      url: '/suno/audios',
      method: 'post',
      headers: { authorization: 'Bearer undefined' }
    });

    await expect(promise).rejects.toBeInstanceOf(AuthRequiredError);
    expect(send).not.toHaveBeenCalled();
    expect(auth.ensureLoggedIn).toHaveBeenCalledOnce();
  });

  it('blocks a signed-in request while its service credential is not ready', async () => {
    auth.accountToken = 'account-token';
    const { promise, send } = request({
      baseURL: 'https://api.acedata.cloud',
      url: '/suno/audios',
      method: 'post',
      headers: { authorization: 'Bearer null' }
    });

    await expect(promise).rejects.toBeInstanceOf(CredentialNotReadyError);
    expect(send).not.toHaveBeenCalled();
    expect(auth.ensureLoggedIn).not.toHaveBeenCalled();
  });

  it('allows an API request carrying a valid service credential', async () => {
    const { promise, send } = request({
      baseURL: 'https://api.acedata.cloud',
      url: '/suno/audios',
      method: 'post',
      headers: { authorization: 'Bearer service-token' }
    });

    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(send).toHaveBeenCalledOnce();
  });

  it.each(['https://x402.acedata.cloud', 'https://platform.acedata.cloud', 'https://example.com'])(
    'does not apply service-token policy to %s',
    async (baseURL) => {
      const { promise, send } = request({ baseURL, url: '/resource', method: 'post' });
      await expect(promise).resolves.toMatchObject({ status: 200 });
      expect(send).toHaveBeenCalledOnce();
      expect(auth.ensureLoggedIn).not.toHaveBeenCalled();
    }
  );
});

describe('default axios service operators', () => {
  it('guards a real default-axios request after installation', async () => {
    const send = vi.fn();
    const off = installServiceRequestAuthGuard(axios);
    const previousAdapter = axios.defaults.adapter;
    axios.defaults.adapter = adapter(send);
    try {
      await expect(
        axios.post(
          '/flux/images',
          {},
          {
            baseURL: 'https://api.acedata.cloud',
            headers: { authorization: 'Bearer undefined' }
          }
        )
      ).rejects.toBeInstanceOf(AuthRequiredError);
      expect(send).not.toHaveBeenCalled();
    } finally {
      axios.defaults.adapter = previousAdapter;
      off();
    }
  });
});
