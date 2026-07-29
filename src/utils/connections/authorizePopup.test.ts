// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openAuthorizePopup, popupReturnUrl } from './authorizePopup';

const AUTH_ORIGIN = 'https://auth.acedata.cloud';

describe('popupReturnUrl', () => {
  it('points at the AuthFrontend lander and carries our origin', () => {
    const url = new URL(popupReturnUrl());
    expect(url.origin).toBe(AUTH_ORIGIN);
    expect(url.pathname).toBe('/connections/popup-return');
    expect(url.searchParams.get('opener_origin')).toBe(window.location.origin);
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

  it('resolves with the payload posted by the lander', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    expect(pending).not.toBeNull();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: AUTH_ORIGIN,
        source: popup as unknown as Window,
        data: { name: 'connection-result', data: { status: 'success', connection_id: 'c1' } }
      })
    );

    await expect(pending).resolves.toEqual({ status: 'success', connection_id: 'c1' });
    expect(popup.close).toHaveBeenCalled();
  });

  it('ignores messages from another origin', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.com',
        source: popup as unknown as Window,
        data: { name: 'connection-result', data: { status: 'success', connection_id: 'stolen' } }
      })
    );

    // Not settled by the spoofed message — only the popup closing ends it.
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(600);
    await expect(pending).resolves.toBeNull();
  });

  it('ignores messages from a different window on the trusted origin', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: AUTH_ORIGIN,
        source: { other: true } as unknown as Window,
        data: { name: 'connection-result', data: { status: 'success', connection_id: 'stolen' } }
      })
    );

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(600);
    await expect(pending).resolves.toBeNull();
  });

  it('resolves null when the user closes the popup without authorizing', async () => {
    const popup = fakePopup();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

    const pending = openAuthorizePopup('https://provider.example/authorize');
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(600);
    await expect(pending).resolves.toBeNull();
  });
});
