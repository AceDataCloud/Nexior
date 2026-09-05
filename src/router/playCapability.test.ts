import { afterEach, describe, expect, it, vi } from 'vitest';

async function routePaths(playBuild: boolean): Promise<string[]> {
  vi.resetModules();
  vi.stubEnv('VITE_PLAY_BUILD', playBuild ? 'true' : 'false');
  const { routes } = await import('./index');
  return routes.map((route) => String(route.path));
}

describe('Google Play capability boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not register the Nano Banana route in the Play bundle', async () => {
    expect(await routePaths(true)).not.toContain('/nanobanana');
  });

  it('keeps the Nano Banana route in non-Play builds', async () => {
    expect(await routePaths(false)).toContain('/nanobanana');
  });
});
