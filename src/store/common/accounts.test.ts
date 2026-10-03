import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), activate: vi.fn(), adding: false, begin: vi.fn(), cancel: vi.fn() }));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('@/operators', () => ({}));
vi.mock('@/utils', () => ({}));
vi.mock('@/utils/loginMethod', () => ({ isIframeLoginEnabled: () => true }));
vi.mock('@/utils/baseUrl', () => ({ getBaseUrlPlatform: () => 'https://platform.example' }));
vi.mock('@/utils/auth/accountSessions', () => ({
  activateAccount: mocks.activate,
  isAddingAccount: () => mocks.adding,
  beginAddingAccount: mocks.begin,
  cancelAddingAccount: mocks.cancel
}));
import { addAccount, switchAccount, setToken, logout } from './actions';
import { forgetCurrentAccount } from './mutations';
const a = { user: { id: 'a' }, token: { access: 'a-token' } };
const b = { user: { id: 'b' }, token: { access: 'b-token' } };
function context() {
  return { state: { user: a.user, token: a.token, accounts: [a, b] }, commit: vi.fn(), dispatch: vi.fn() };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.adding = false;
  vi.stubGlobal('window', { location: { pathname: '/', search: '' } });
});

describe('account actions', () => {
  it('validates the selected token before switching', async () => {
    mocks.get.mockResolvedValue({ data: b.user });
    const ctx = context();
    await switchAccount(ctx as never, 'b');
    expect(mocks.get).toHaveBeenCalledWith('https://platform.example/api/v1/users/me', {
      headers: { Authorization: 'Bearer b-token' },
      timeout: 20000
    });
    expect(mocks.activate).toHaveBeenCalledWith(ctx.state, b);
  });
  it('does not alter the active account on an expired token, network failure or identity mismatch', async () => {
    const ctx = context();
    mocks.get
      .mockRejectedValueOnce(new Error('401'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: a.user });
    for (let i = 0; i < 3; i++) await expect(switchAccount(ctx as never, 'b')).rejects.toThrow();
    expect(mocks.activate).not.toHaveBeenCalled();
    expect(ctx.commit).not.toHaveBeenCalled();
    expect(ctx.dispatch).not.toHaveBeenCalled();
  });
  it('does nothing when selecting the current account', async () => {
    await switchAccount(context() as never, 'a');
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it('retains the active account while starting another login', async () => {
    const ctx = context();
    await addAccount(ctx as never);
    expect(ctx.commit).toHaveBeenCalledExactlyOnceWith('rememberCurrentAccount');
    expect(mocks.begin).toHaveBeenCalled();
    expect(ctx.dispatch).toHaveBeenCalledExactlyOnceWith('login', { redirect: '/', addAccount: true });
  });
  it('completes an added login through a clean document instead of mixing tokens and cached data', async () => {
    mocks.adding = true;
    mocks.get.mockResolvedValue({ data: b.user });
    const ctx = context();
    expect(await setToken(ctx as never, b.token)).toBe(true);
    expect(mocks.activate).toHaveBeenCalledWith(ctx.state, b);
    expect(ctx.commit).toHaveBeenCalledExactlyOnceWith('rememberCurrentAccount');
    expect(ctx.dispatch).not.toHaveBeenCalled();
  });
  it('isolates a late login callback even after the add-account dialog was cancelled', async () => {
    mocks.get.mockResolvedValue({ data: b.user });
    const ctx = context();
    expect(await setToken(ctx as never, b.token)).toBe(true);
    expect(mocks.activate).toHaveBeenCalledWith(ctx.state, b);
  });
  it('renews the same account without replacing the requested return page', async () => {
    const ctx = context();
    const token = { access: 'a-renewed' };
    mocks.get.mockResolvedValue({ data: a.user });
    await setToken(ctx as never, token);
    expect(mocks.activate).not.toHaveBeenCalled();
    expect(ctx.commit).toHaveBeenCalledWith('setToken', token);
    expect(ctx.commit).toHaveBeenCalledWith('rememberCurrentAccount');
  });
  it('removes only the signed-out account even while its profile is being fetched', async () => {
    const ctx = context();
    await logout(ctx as never);
    expect(ctx.commit.mock.calls[0]).toEqual(['forgetCurrentAccount']);
    const state = { ...ctx.state, user: {} };
    forgetCurrentAccount(state as never);
    expect(state.accounts).toEqual([b]);
  });
});
