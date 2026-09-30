import type { IToken, IUser } from '@/models';

export interface SavedAccount {
  user: Pick<IUser, 'id' | 'email' | 'username' | 'nickname' | 'avatar'>;
  token: IToken;
}

const ADD_ACCOUNT_KEY = 'nexior:add-account';
let transitioning = false;

export function rememberAccount(accounts: SavedAccount[], user: IUser | undefined, token: IToken): SavedAccount[] {
  if (!user?.id || !token.access) return accounts;
  const { id, email, username, nickname, avatar } = user;
  const account = { user: { id, email, username, nickname, avatar }, token: { ...token } };
  const index = accounts.findIndex((item) => item.user.id === id);
  return index < 0 ? [...accounts, account] : accounts.map((item, i) => (i === index ? account : item));
}

export function beginAddingAccount(): void {
  sessionStorage.setItem(ADD_ACCOUNT_KEY, String(Date.now()));
}

export function cancelAddingAccount(): void {
  try {
    sessionStorage.removeItem(ADD_ACCOUNT_KEY);
  } catch {
    // Session storage can be disabled independently of persistent storage.
  }
}

export function isAddingAccount(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const started = Number(sessionStorage.getItem(ADD_ACCOUNT_KEY));
  return started > 0 && Date.now() - started < 30 * 60 * 1000;
}

export function isAccountTransitioning(): boolean {
  return transitioning;
}

/** Keep device preferences, but never carry conversations, app credentials or drafts across accounts. */
export function accountSessionState(state: Record<string, any>, account: SavedAccount): Record<string, any> {
  return {
    token: account.token,
    user: account.user,
    savedAccounts: rememberAccount(state.savedAccounts || [], account.user, account.token),
    setting: state.setting,
    locale: state.locale,
    dark: state.dark,
    currency: state.currency,
    fingerprint: state.fingerprint
  };
}

/** A fresh document also disposes streams, in-flight requests and component-local caches. */
export function activateAccount(state: Record<string, any>, account: SavedAccount): void {
  const next = JSON.stringify(accountSessionState(state, account));
  // Do not change the current account if storage is unavailable/full.
  localStorage.setItem('vuex', next);
  transitioning = true;
  cancelAddingAccount();
  window.location.replace(new URL('/', window.location.href).href);
}

/** Other tabs share the persisted session and must discard their old in-memory identity too. */
export function followAccountChange(event: StorageEvent, currentAccess?: string): void {
  if (event.storageArea !== localStorage || (event.key !== 'vuex' && event.key !== null)) return;
  try {
    const access = event.newValue ? JSON.parse(event.newValue)?.token?.access : undefined;
    if (access === currentAccess || transitioning) return;
    transitioning = true;
    cancelAddingAccount();
    window.location.replace(new URL('/', window.location.href).href);
  } catch {
    // Ignore malformed storage from an older client.
  }
}
