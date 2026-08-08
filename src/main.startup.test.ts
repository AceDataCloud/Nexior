import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');

describe('native startup', () => {
  it('acknowledges the native updater before background API initialization', () => {
    expect(source.indexOf('void runLiveUpdate();')).toBeGreaterThan(-1);
    expect(source.indexOf('startPostMountBoot(')).toBeGreaterThan(source.indexOf('void runLiveUpdate();'));
  });

  it('exchanges an SSO callback code before the callback component can redirect', () => {
    expect(source.indexOf('if (isSsoCallback) {\n    await initializeToken();')).toBeGreaterThan(-1);
    expect(source.indexOf('if (isSsoCallback) {\n    await initializeToken();')).toBeLessThan(
      source.indexOf('startPostMountBoot(')
    );
  });

  it('re-evaluates the root redirect after site features load', () => {
    expect(source).toContain('await router.replace({ ...getDefaultRoute(), query: router.currentRoute.value.query });');
  });
});
