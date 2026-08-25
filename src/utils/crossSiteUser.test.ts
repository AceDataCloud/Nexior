import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  loginRedirect: vi.fn(),
  iframeLogin: false
}));

vi.mock('@/store', () => ({
  default: {
    getters: { user: { id: 'current-user' } },
    dispatch: mocks.dispatch
  }
}));

vi.mock('./login', () => ({
  loginRedirect: mocks.loginRedirect
}));

vi.mock('./loginMethod', () => ({
  isIframeLoginEnabled: () => mocks.iframeLogin
}));

vi.mock('./is', () => ({
  isMainOfficial: () => true
}));

import { evaluateUserIdGuard } from './crossSiteUser';

describe('evaluateUserIdGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.iframeLogin = false;
  });

  it('clears all account-owned state before redirecting a mismatched user', () => {
    const result = evaluateUserIdGuard({
      path: '/nanobanana',
      query: { user_id: 'expected-user', prompt: 'cat' }
    } as any);

    expect(result).toEqual({ kind: 'mismatch' });
    expect(mocks.dispatch).toHaveBeenCalledWith('resetAll');
    expect(mocks.dispatch).not.toHaveBeenCalledWith('resetToken');
    expect(mocks.dispatch).not.toHaveBeenCalledWith('resetUser');
    expect(mocks.loginRedirect).toHaveBeenCalledWith({ redirect: '/nanobanana?prompt=cat' });
  });
});
