import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/store', () => ({ default: {} }));
vi.mock('./auth/accountSessions', () => ({ isAddingAccount: () => false }));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn(), setCookie: vi.fn() }));
vi.mock('./theme', () => ({ applyAccentColor: vi.fn(), applyThemePreference: vi.fn() }));
vi.mock('@/i18n', () => ({ getLocale: vi.fn() }));
vi.mock('./is', () => ({ isWechatBrowser: () => true }));
vi.mock('./domain', () => ({ getDomain: vi.fn() }));

import { initializeRedirect } from './initializer';

describe('WeChat date navigation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserves the full destination and pins callbacks to the initiating origin', async () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const path = '/chat/123?mode=music&lang=zh-CN#draft';
    const location = { href: `https://studio.acedata.cloud${path}`, replace: vi.fn() };
    vi.stubGlobal('window', { location });
    expect(await initializeRedirect()).toBe(true);
    expect(location.replace).toHaveBeenCalledWith(`https://${date}.studio.acedata.cloud${path}`);
    for (const href of [
      `https://${date}.studio.acedata.cloud${path}`,
      'https://studio.acedata.cloud/auth/callback?code=once',
      'https://tenant.studio.acedata.cloud/'
    ]) {
      location.href = href;
      expect(await initializeRedirect()).toBe(false);
    }
    expect(location.replace).toHaveBeenCalledOnce();
  });
});
