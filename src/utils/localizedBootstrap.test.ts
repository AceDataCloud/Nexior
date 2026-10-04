import { describe, expect, it, vi } from 'vitest';
import { initializeLocalizedBootstrap } from './localizedBootstrap';

const makeDependencies = (localeChanged: boolean) => {
  const calls: string[] = [];
  return {
    calls,
    dependencies: {
      initializeSite: vi.fn(async () => {
        calls.push('site');
      }),
      applySiteLocale: vi.fn(async () => {
        calls.push('locale');
        return localeChanged;
      }),
      initializeUser: vi.fn(async () => {
        calls.push('user');
      }),
      initializeConfig: vi.fn(async () => {
        calls.push('config');
      })
    }
  };
};

describe('initializeLocalizedBootstrap', () => {
  it('loads localized bootstrap data once when the site keeps the saved locale', async () => {
    const { calls, dependencies } = makeDependencies(false);

    await initializeLocalizedBootstrap(dependencies);

    expect(calls.slice(0, 2)).toEqual(['site', 'locale']);
    expect(calls.slice(2).sort()).toEqual(['config', 'user']);
    expect(dependencies.initializeSite).toHaveBeenCalledTimes(1);
  });

  it('refetches the site before other localized data when its locale policy changes the locale', async () => {
    const { calls, dependencies } = makeDependencies(true);

    await initializeLocalizedBootstrap(dependencies);

    expect(calls.slice(0, 3)).toEqual(['site', 'locale', 'site']);
    expect(calls.slice(3).sort()).toEqual(['config', 'user']);
    expect(dependencies.initializeSite).toHaveBeenCalledTimes(2);
  });
});
