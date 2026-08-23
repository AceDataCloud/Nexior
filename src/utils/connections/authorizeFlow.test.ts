// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const surface = vi.hoisted(() => ({ isNative: vi.fn(() => false), isDesktop: vi.fn(() => false) }));
const capBrowser = vi.hoisted(() => ({ open: vi.fn(), addListener: vi.fn() }));
const bridge = vi.hoisted(() => ({ desktopBridge: vi.fn() }));
const popup = vi.hoisted(() => ({ openAuthorizePopup: vi.fn() }));
const handoff = vi.hoisted(() => ({
  isAuthFrontendUrl: vi.fn((url: string) => new URL(url).origin === 'https://auth.acedata.cloud'),
  prepareConnectorAuthorizationUrl: vi.fn(async (url: string, token?: string) =>
    token || new URL(url).origin === 'https://auth.acedata.cloud'
      ? `https://auth.acedata.cloud/auth/login/?redirect=${encodeURIComponent(url)}`
      : url
  )
}));

vi.mock('../surface', () => surface);
vi.mock('@capacitor/browser', () => ({ Browser: capBrowser }));
vi.mock('../desktop', () => bridge);
vi.mock('./authorizePopup', () => popup);
vi.mock('../authHandoff', () => handoff);

import { openAuthorizeFlow, prepareAuthorizeFlow } from './authorizeFlow';

const URL_UNDER_TEST = 'https://accounts.google.com/o/oauth2/auth?client_id=x';
const MCP_URL_UNDER_TEST = 'https://serp.mcp.acedata.cloud/authorize?client_id=dynamic';
const AUTH_URL_UNDER_TEST = 'https://auth.acedata.cloud/oauth2/authorize?client_id=serp';

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
    handoff.isAuthFrontendUrl.mockImplementation((url: string) => new URL(url).origin === 'https://auth.acedata.cloud');
    handoff.prepareConnectorAuthorizationUrl.mockImplementation(async (url: string, token?: string) =>
      token || new URL(url).origin === 'https://auth.acedata.cloud'
        ? `https://auth.acedata.cloud/auth/login/?redirect=${encodeURIComponent(url)}`
        : url
    );
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

    it('pre-opens a blank popup while preparing an AuthFrontend session handoff', async () => {
      let resolvePopup!: () => void;
      popup.openAuthorizePopup.mockImplementation((target: Promise<string>) => {
        expect(target).toBeInstanceOf(Promise);
        void expect(target).resolves.toContain('/auth/login/');
        return new Promise<void>((resolve) => {
          resolvePopup = resolve;
        });
      });

      const pending = openAuthorizeFlow(AUTH_URL_UNDER_TEST);
      expect(popup.openAuthorizePopup).toHaveBeenCalledOnce();
      expect(handoff.prepareConnectorAuthorizationUrl).toHaveBeenCalledWith(AUTH_URL_UNDER_TEST, undefined);
      resolvePopup();
      await pending;
    });

    it('prepares the same session handoff for a first-party MCP authorize endpoint', async () => {
      popup.openAuthorizePopup.mockImplementation((target: Promise<string>) => {
        void expect(target).resolves.toContain('/auth/login/');
        return Promise.resolve();
      });

      await openAuthorizeFlow(MCP_URL_UNDER_TEST, 'signed-handoff');

      expect(handoff.prepareConnectorAuthorizationUrl).toHaveBeenCalledWith(MCP_URL_UNDER_TEST, 'signed-handoff');
    });

    it('does not prepare an AuthFrontend handoff for an external provider', async () => {
      popup.openAuthorizePopup.mockReturnValue(Promise.resolve());

      await openAuthorizeFlow(URL_UNDER_TEST);

      expect(popup.openAuthorizePopup).toHaveBeenCalledWith(URL_UNDER_TEST);
      expect(handoff.prepareConnectorAuthorizationUrl).not.toHaveBeenCalled();
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

    it('hands Auth-hosted authorization through the white-label SSO login', async () => {
      const { finish } = stubBrowserFinished();
      capBrowser.open.mockResolvedValue(undefined);

      const pending = openAuthorizeFlow(AUTH_URL_UNDER_TEST);
      await vi.waitFor(() =>
        expect(capBrowser.open).toHaveBeenCalledWith({ url: expect.stringContaining('/auth/login/') })
      );
      expect(handoff.prepareConnectorAuthorizationUrl).toHaveBeenCalledWith(AUTH_URL_UNDER_TEST, undefined);
      finish();
      await pending;
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

    function desktopCallbackBridge() {
      let callback: ((result: any) => void) | undefined;
      const off = vi.fn();
      const value = {
        createConnectorCallback: vi.fn().mockResolvedValue({
          requestId: 'request-1',
          returnUrl: 'https://auth.acedata.cloud/connections/popup-return?desktop_state=state-1'
        }),
        openAuthorizeConnector: vi.fn().mockResolvedValue(undefined),
        onConnectorCallback: vi.fn((handler: (result: any) => void) => {
          callback = handler;
          return off;
        })
      };
      bridge.desktopBridge.mockReturnValue(value);
      return { value, off, send: (result: any) => callback?.(result) };
    }

    it('prepares a nonce-bound desktop return URL', async () => {
      const { value } = desktopCallbackBridge();
      await expect(prepareAuthorizeFlow('https://studio.acedata.cloud/return')).resolves.toEqual({
        requestId: 'request-1',
        returnUrl: 'https://auth.acedata.cloud/connections/popup-return?desktop_state=state-1'
      });
      expect(value.createConnectorCallback).toHaveBeenCalledOnce();
    });

    it('resolves only on the matching verified callback, not window focus', async () => {
      const { value, off, send } = desktopCallbackBridge();
      let settled = false;
      const pending = openAuthorizeFlow(URL_UNDER_TEST, undefined, 'request-1').then((result) => {
        settled = true;
        return result;
      });
      await vi.waitFor(() => expect(value.openAuthorizeConnector).toHaveBeenCalledWith(URL_UNDER_TEST));
      window.dispatchEvent(new Event('focus'));
      expect(settled).toBe(false);
      send({ requestId: 'other', status: 'success' });
      expect(settled).toBe(false);
      send({ requestId: 'request-1', status: 'success', connectionId: 'connection-1' });
      await expect(pending).resolves.toMatchObject({ status: 'success', connectionId: 'connection-1' });
      expect(off).toHaveBeenCalledOnce();
    });

    it('keeps the white-label SSO handoff token separate from callback state', async () => {
      const { value, send } = desktopCallbackBridge();
      const pending = openAuthorizeFlow(AUTH_URL_UNDER_TEST, 'handoff-1', 'request-1');
      await vi.waitFor(() =>
        expect(value.openAuthorizeConnector).toHaveBeenCalledWith(expect.stringContaining('/auth/login/'))
      );
      expect(handoff.prepareConnectorAuthorizationUrl).toHaveBeenCalledWith(AUTH_URL_UNDER_TEST, 'handoff-1');
      send({ requestId: 'request-1', status: 'success' });
      await pending;
    });

    it('throws on a desktop shell without the callback IPC', async () => {
      bridge.desktopBridge.mockReturnValue({});
      await expect(prepareAuthorizeFlow('https://studio.acedata.cloud/return')).rejects.toThrow(
        'desktop-authorize-unsupported'
      );
      expect(popup.openAuthorizePopup).not.toHaveBeenCalled();
    });
  });
});
