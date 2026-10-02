// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  store: { state: { token: undefined as { access: string } | undefined }, dispatch: vi.fn() },
  adding: false,
  native: false,
  official: false
}));
vi.mock('@/store', () => ({ default: fixture.store }));
vi.mock('../baseUrl', () => ({ getBaseUrlAuth: () => 'https://auth.acedata.cloud' }));
vi.mock('../surface', () => ({ isNative: () => fixture.native, isDesktop: () => false }));
vi.mock('./accountSessions', () => ({ isAddingAccount: () => fixture.adding }));
vi.mock('../officialHost', () => ({
  officialSiteHost: (host: string) => (fixture.official ? 'studio.acedata.cloud' : host)
}));
import { requestSessionCode, restoreSession } from './session';

function message(code?: string, overrides: Partial<MessageEventInit> = {}) {
  const frame = document.querySelector('iframe')!;
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://auth.acedata.cloud',
      source: frame.contentWindow,
      data: { name: 'auth-session', request_id: new URL(frame.src).searchParams.get('request_id'), code },
      ...overrides
    })
  );
}

describe('session code bridge', () => {
  beforeEach(() => {
    fixture.store.state.token = undefined;
    fixture.adding = false;
    fixture.native = false;
    fixture.official = false;
    fixture.store.dispatch.mockReset();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('accepts only the auth frame and matching request ID', async () => {
    const result = requestSessionCode('https://auth.acedata.cloud');
    message('bad', { origin: 'https://evil.com' });
    message('bad', { source: window });
    message('bad', { data: { name: 'auth-session', request_id: 'replay', code: 'bad' } });
    expect(document.querySelector('iframe')).not.toBeNull();
    message('once');
    expect(await result).toBe('once');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('finishes silently when anonymous or blocked', async () => {
    const anonymous = requestSessionCode('https://auth.acedata.cloud');
    message();
    expect(await anonymous).toBeUndefined();
    expect(await requestSessionCode('https://auth.acedata.cloud', 1)).toBeUndefined();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('does not probe native, active accounts, additions or nonofficial origins', async () => {
    fixture.native = true;
    await restoreSession();
    fixture.native = false;
    fixture.store.state.token = { access: 'saved' };
    await restoreSession();
    fixture.store.state.token = undefined;
    fixture.adding = true;
    await restoreSession();
    fixture.adding = false;
    await restoreSession();
    expect(document.querySelector('iframe')).toBeNull();
    expect(fixture.store.dispatch).not.toHaveBeenCalled();
  });

  it('restores one code on a new official origin without replacing a later login', async () => {
    fixture.official = true;
    const restored = restoreSession();
    message('once');
    await restored;
    expect(fixture.store.dispatch).toHaveBeenCalledWith('getToken', 'once');
    fixture.store.dispatch.mockReset();
    const pending = restoreSession();
    fixture.store.state.token = { access: 'new-account' };
    message('old-account');
    await pending;
    expect(fixture.store.dispatch).not.toHaveBeenCalled();
  });
});
