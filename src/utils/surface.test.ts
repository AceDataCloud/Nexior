// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getSurface,
  isWeb,
  isIOS,
  isAndroid,
  isDesktop,
  isNative,
  getPaymentSurface,
  getDesktopOS,
  isWindows,
  isMacOS
} from './surface';

/**
 * Surface resolution must keep `isNative()` meaning "Capacitor mobile" while
 * `isDesktop()` is an independent predicate — desktop (Electron) must NOT be
 * treated as native (which gates IAP / push / Capacitor OTA).
 */
describe('surface', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const withSurface = (value?: string) => {
    if (value === undefined) vi.stubEnv('VITE_SURFACE', '');
    else vi.stubEnv('VITE_SURFACE', value);
  };

  describe('getSurface', () => {
    it('returns desktop when VITE_SURFACE=desktop', () => {
      withSurface('desktop');
      expect(getSurface()).toBe('desktop');
    });

    it('returns ios / android for the mobile surfaces', () => {
      withSurface('ios');
      expect(getSurface()).toBe('ios');
      withSurface('android');
      expect(getSurface()).toBe('android');
    });

    it('coerces an unknown surface back to web (but NOT desktop)', () => {
      withSurface('toaster');
      expect(getSurface()).toBe('web');
    });

    it('defaults to web when unset', () => {
      withSurface('');
      expect(getSurface()).toBe('web');
    });
  });

  describe('predicates', () => {
    it('isDesktop true only on desktop, and desktop is NOT native', () => {
      withSurface('desktop');
      expect(isDesktop()).toBe(true);
      expect(isNative()).toBe(false); // critical: desktop must not hit IAP/push/OTA
      expect(isWeb()).toBe(false);
      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(false);
    });

    it('isNative true on ios/android, isDesktop false there', () => {
      withSurface('ios');
      expect(isNative()).toBe(true);
      expect(isDesktop()).toBe(false);
      withSurface('android');
      expect(isNative()).toBe(true);
      expect(isDesktop()).toBe(false);
    });

    it('web is neither native nor desktop', () => {
      withSurface('web');
      expect(isWeb()).toBe(true);
      expect(isNative()).toBe(false);
      expect(isDesktop()).toBe(false);
    });
  });

  describe('getDesktopOS (runtime, via window.desktop bridge)', () => {
    afterEach(() => {
      delete (window as unknown as { desktop?: unknown }).desktop;
    });
    const setPlatform = (platform?: string) => {
      (window as unknown as { desktop?: { platform?: string } }).desktop = platform ? { platform } : undefined;
    };

    it('maps win32 → windows and darwin → mac', () => {
      setPlatform('win32');
      expect(getDesktopOS()).toBe('windows');
      expect(isWindows()).toBe(true);
      expect(isMacOS()).toBe(false);
      setPlatform('darwin');
      expect(getDesktopOS()).toBe('mac');
      expect(isMacOS()).toBe(true);
      expect(isWindows()).toBe(false);
    });

    it('is undefined off-desktop (no bridge)', () => {
      setPlatform(undefined);
      expect(getDesktopOS()).toBeUndefined();
      expect(isWindows()).toBe(false);
      expect(isMacOS()).toBe(false);
    });
  });

  describe('getPaymentSurface', () => {
    it('returns pc on desktop (AliPay Page / Stripe web surface)', () => {
      withSurface('desktop');
      expect(getPaymentSurface()).toBe('pc');
    });

    it('returns ios / android on the mobile surfaces', () => {
      withSurface('ios');
      expect(getPaymentSurface()).toBe('ios');
      withSurface('android');
      expect(getPaymentSurface()).toBe('android');
    });
  });
});
