import { beforeEach, describe, expect, it, vi } from 'vitest';

const a = { user: { id: 'a', email: 'a@example.com' }, token: { access: 'token-a' } };
const b = { user: { id: 'b', email: 'b@example.com' }, token: { access: 'token-b' } };
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => data.delete(key))
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage());
  vi.stubGlobal('sessionStorage', storage());
  vi.stubGlobal('window', { location: { href: 'https://studio.example/chat/private-a?code=old', replace: vi.fn() } });
});

describe('saved account sessions', () => {
  it('updates a duplicate account without copying privileged profile fields', async () => {
    const { rememberAccount } = await import('./accountSessions');
    const accounts = rememberAccount([a, b], { ...a.user, nickname: 'New', is_superuser: true }, { access: 'new-a' });
    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toEqual({ user: { ...a.user, nickname: 'New' }, token: { access: 'new-a' } });
    expect(rememberAccount(accounts, {}, { access: 'orphan' })).toBe(accounts);
  });

  it('drops all account-owned caches including unregistered lazy modules on switch', async () => {
    const { activateAccount, isAccountTransitioning, beginAddingAccount, isAddingAccount } =
      await import('./accountSessions');
    beginAddingAccount();
    activateAccount(
      {
        savedAccounts: [a],
        token: a.token,
        setting: { dockCollapsed: true },
        chat: { conversations: ['secret'], credential: 'a-key' },
        suno: { tasks: ['secret'] },
        applications: ['a-app']
      },
      b
    );
    const saved = JSON.parse(localStorage.getItem('vuex')!);
    expect(saved).toEqual({ token: b.token, user: b.user, savedAccounts: [a, b], setting: { dockCollapsed: true } });
    expect(window.location.replace).toHaveBeenCalledWith('https://studio.example/');
    expect(isAccountTransitioning()).toBe(true);
    expect(isAddingAccount()).toBe(false);
  });

  it('keeps the old account usable when persistence fails', async () => {
    const { activateAccount, isAccountTransitioning } = await import('./accountSessions');
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => activateAccount({ savedAccounts: [a] }, b)).toThrow('quota');
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(isAccountTransitioning()).toBe(false);
  });

  it('cancels adding without changing the current session and expires abandoned flows', async () => {
    const { beginAddingAccount, cancelAddingAccount, isAddingAccount } = await import('./accountSessions');
    beginAddingAccount();
    expect(isAddingAccount()).toBe(true);
    cancelAddingAccount();
    expect(isAddingAccount()).toBe(false);
    beginAddingAccount();
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000);
    expect(isAddingAccount()).toBe(false);
    vi.restoreAllMocks();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('reloads other tabs only when their active token changes', async () => {
    const { followAccountChange, isAccountTransitioning } = await import('./accountSessions');
    followAccountChange(
      { key: 'vuex', storageArea: localStorage, newValue: JSON.stringify({ token: a.token }) } as StorageEvent,
      a.token.access
    );
    expect(window.location.replace).not.toHaveBeenCalled();
    followAccountChange(
      { key: 'vuex', storageArea: localStorage, newValue: JSON.stringify({ token: b.token }) } as StorageEvent,
      a.token.access
    );
    expect(window.location.replace).toHaveBeenCalledWith('https://studio.example/');
    expect(isAccountTransitioning()).toBe(true);
  });
});
