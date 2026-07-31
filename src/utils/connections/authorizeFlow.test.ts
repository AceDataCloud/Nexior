// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const surface = vi.hoisted(() => ({ isNative: vi.fn(() => false), isDesktop: vi.fn(() => false) }));
const capBrowser = vi.hoisted(() => ({ open: vi.fn(), addListener: vi.fn() }));
const bridge = vi.hoisted(() => ({ desktopBridge: vi.fn() }));
const popup = vi.hoisted(() => ({ openAuthorizePopup: vi.fn() }));

vi.mock('../surface', () => surface);
vi.mock('@capacitor/browser', () => ({ Browser: capBrowser }));
vi.mock('../desktop', () => bridge);
vi.mock('./authorizePopup', () => popup);

import { openAuthorizeFlow } from './authorizeFlow';

const URL_UNDER_TEST = 'https://accounts.google.com/o/oauth2/auth?client_id=x';

/** A resolved `browserFinished` subscription, plus the callback it captured. */
function stubBrowserFinished() {
  const remove = vi.fn().mockResolvedValue(undefined);
  let fire = () => {};
  capBrowser.addListener.mockImplementation((_event: string, cb: () => void) => {
    fire = cb;
    return Promise.resolve({ remove });
  });
  return { remove, finish: () => fire() };
}

describe('openAuthorizeFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    surface.isNative.mockReturnValue(false);
    surface.isDesktop.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('web', () => {
    it('resolves when the popup closes', async () => {
      popup.openAuthorizePopup.mockReturnValue(Promise.resolve());
      await expect(openAuthorizeFlow(URL_UNDER_TEST)).resolves.toBeUndefined();
      expect(popup.openAuthorizePopup).toHaveBeenCalledWith(URL_UNDER_TEST);
    });

    it('falls back to a full-page navigation when the popup is blocked', async () => {
      popup.openAuthorizePopup.mockReturnValue(null);
      const assign = vi.fn();
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          set href(v: string) {
            assign(v);
          }
        },
        writable: true
      });

      await openAuthorizeFlow(URL_UNDER_TEST);
      expect(assign).toHaveBeenCalledWith(URL_UNDER_TEST);
    });
  });

  describe('native', () => {
    beforeEach(() => surface.isNative.mockReturnValue(true));

    it('uses the in-app browser, never window.open', async () => {
      const { finish } = stubBrowserFinished();
      capBrowser.open.mockResolvedValue(undefined);
      const openSpy = vi.spyOn(window, 'open');

      const pending = openAuthorizeFlow(URL_UNDER_TEST);
      await vi.waitFor(() => expect(capBrowser.open).toHaveBeenCalledWith({ url: URL_UNDER_TEST }));
      finish();
      await pending;

      // A window.open here would eject to Chrome/Safari and, on Android,
      // the href fallback would fire the same navigation a second time.
      expect(openSpy).not.toHaveBeenCalled();
      expect(popup.openAuthorizePopup).not.toHaveBeenCalled();
    });

    it('stays pending until the user dismisses the browser', async () => {
      const { finish } = stubBrowserFinished();
      capBrowser.open.mockResolvedValue(undefined);

      let settled = false;
      void openAuthorizeFlow(URL_UNDER_TEST).then(() => {
        settled = true;
      });
      await vi.waitFor(() => expect(capBrowser.open).toHaveBeenCalled());
      expect(settled).toBe(false);

      finish();
      await vi.waitFor(() => expect(settled).toBe(true));
    });

    it('removes the listener so a second authorize does not double-fire', async () => {
      const { remove, finish } = stubBrowserFinished();
      capBrowser.open.mockResolvedValue(undefined);

      const pending = openAuthorizeFlow(URL_UNDER_TEST);
      await vi.waitFor(() => expect(capBrowser.open).toHaveBeenCalled());
      finish();
      await pending;

      expect(remove).toHaveBeenCalled();
    });

    it('resolves rather than hanging when the browser fails to open', async () => {
      stubBrowserFinished();
      capBrowser.open.mockRejectedValue(new Error('no browser'));
      // A rejection that swallowed the promise would leave the caller's
      // spinner up forever.
      await expect(openAuthorizeFlow(URL_UNDER_TEST)).resolves.toBeUndefined();
    });
  });

  describe('desktop', () => {
    beforeEach(() => surface.isDesktop.mockReturnValue(true));

    it('hands the url to the main process and resolves on window focus', async () => {
      const openAuthorizeConnector = vi.fn().mockResolvedValue(undefined);
      bridge.desktopBridge.mockReturnValue({ openAuthorizeConnector });

      let settled = false;
      void openAuthorizeFlow(URL_UNDER_TEST).then(() => {
        settled = true;
      });
      await vi.waitFor(() => expect(openAuthorizeConnector).toHaveBeenCalledWith(URL_UNDER_TEST));
      expect(settled).toBe(false);

      window.dispatchEvent(new Event('focus'));
      await vi.waitFor(() => expect(settled).toBe(true));
    });

    it('throws on a desktop shell without the IPC instead of silently doing nothing', async () => {
      // window.open on desktop is denied by setWindowOpenHandler for any host
      // off EXTERNAL_HOSTS — which lists no OAuth provider — so a fallback
      // would look identical to a dead click.
      bridge.desktopBridge.mockReturnValue({});
      await expect(openAuthorizeFlow(URL_UNDER_TEST)).rejects.toThrow('desktop-authorize-unsupported');
    });

    it('never falls back to the web popup', async () => {
      bridge.desktopBridge.mockReturnValue({});
      await expect(openAuthorizeFlow(URL_UNDER_TEST)).rejects.toThrow();
      expect(popup.openAuthorizePopup).not.toHaveBeenCalled();
    });
  });
});
