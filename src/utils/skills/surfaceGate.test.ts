// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isSurfaceSupported } from './surfaceGate';

/**
 * The gate reads Nexior's own shell detection plus a UA fallback, so the
 * cases worth pinning are: no restriction, an unknown-only restriction
 * (must fail open), and the web-tab default.
 */
describe('isSurfaceSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows a skill with no surface restriction', () => {
    expect(isSurfaceSupported([])).toBe(true);
  });

  it('fails open when every token is unrecognized', () => {
    // A typo or a surface we don't model yet must not block everyone.
    expect(isSurfaceSupported(['smartfridge'])).toBe(true);
  });

  it('allows a web-restricted skill in a plain browser tab', () => {
    expect(isSurfaceSupported(['web'])).toBe(true);
  });

  it('blocks a mobile-only skill in a plain browser tab', () => {
    expect(isSurfaceSupported(['ios', 'android'])).toBe(false);
  });

  it('ignores unknown tokens alongside a known one', () => {
    expect(isSurfaceSupported(['smartfridge', 'web'])).toBe(true);
    expect(isSurfaceSupported(['smartfridge', 'ios'])).toBe(false);
  });
});
