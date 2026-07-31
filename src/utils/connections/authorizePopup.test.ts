// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openAuthorizePopup, popupReturnUrl } from './authorizePopup';

const AUTH_ORIGIN = 'https://auth.acedata.cloud';

describe('popupReturnUrl', () => {
  it('points at the AuthFrontend lander', () => {
    const url = new URL(popupReturnUrl());
    expect(url.origin).toBe(AUTH_ORIGIN);
    expect(url.pathname).toBe('/connections/popup-return');
  });

  it('carries no opener origin — nothing is posted back', () => {
    expect(new URL(popupReturnUrl()).search).toBe('');
  });
});

describe('openAuthorizePopup', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  const fakePopup = () => ({ closed: false, close: vi.fn() });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    openSpy?.mockRestore();
  });

  it('returns null when the popup is blocked so the caller can fall back', () => {
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(openAuthorizePopup('https://provider.example/authorize')).toBeNull();
  });

  it('resolves once the popup closes', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    expect(pending).not.toBeNull();

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(600);
    await expect(pending).resolves.toBeUndefined();
  });

  it('stays pending while the popup is still open', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    let settled = false;
    void pending?.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(5000);
    expect(settled).toBe(false);
  });

  it('is not settled by a message — a spoofed one must not end the flow early', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    let settled = false;
    void pending?.then(() => {
      settled = true;
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.com',
        source: popup as unknown as Window,
        data: { name: 'connection-result', data: { status: 'success', connection_id: 'stolen' } }
      })
    );

    await vi.advanceTimersByTimeAsync(600);
    expect(settled).toBe(false);
  });
});
