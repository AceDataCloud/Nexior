// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthPanel from './AuthPanel.vue';

const addBrowserListenerMock = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/browser', () => ({
  Browser: {
    addListener: addBrowserListenerMock
  }
}));

describe('AuthPanel message listener lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    addBrowserListenerMock.mockReset();
  });

  it('removes the exact window listener registered during mount', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const context = {
      isNative: false,
      messageHandler: null as ((event: MessageEvent) => Promise<void>) | null,
      browserFinishedHandle: null,
      unmounted: false
    };

    await (AuthPanel.mounted as () => Promise<void>).call(context);

    expect(context.messageHandler).toBeTypeOf('function');
    expect(addSpy).toHaveBeenCalledWith('message', context.messageHandler);

    await (AuthPanel.beforeUnmount as () => Promise<void>).call(context);

    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function));
    expect(removeSpy.mock.calls[0]?.[1]).toBe(addSpy.mock.calls[0]?.[1]);
    expect(context.messageHandler).toBeNull();
  });

  it('removes the native browser listener during unmount', async () => {
    const remove = vi.fn();
    addBrowserListenerMock.mockResolvedValue({ remove });
    const context = {
      isNative: true,
      useBrowser: false,
      messageHandler: null as ((event: MessageEvent) => Promise<void>) | null,
      browserFinishedHandle: null as { remove: () => Promise<void> } | null,
      unmounted: false
    };

    await (AuthPanel.mounted as () => Promise<void>).call(context);
    await (AuthPanel.beforeUnmount as () => Promise<void>).call(context);

    expect(addBrowserListenerMock).toHaveBeenCalledWith('browserFinished', expect.any(Function));
    expect(remove).toHaveBeenCalledOnce();
    expect(context.browserFinishedHandle).toBeNull();
  });

  it('removes a native listener that resolves after unmount', async () => {
    let resolveHandle: ((handle: { remove: () => Promise<void> }) => void) | undefined;
    const remove = vi.fn();
    const addWindowListenerSpy = vi.spyOn(window, 'addEventListener');
    addBrowserListenerMock.mockReturnValue(
      new Promise((resolve) => {
        resolveHandle = resolve;
      })
    );
    const context = {
      isNative: true,
      useBrowser: false,
      messageHandler: null as ((event: MessageEvent) => Promise<void>) | null,
      browserFinishedHandle: null as { remove: () => Promise<void> } | null,
      unmounted: false
    };

    const mounting = (AuthPanel.mounted as () => Promise<void>).call(context);
    await (AuthPanel.beforeUnmount as () => Promise<void>).call(context);
    resolveHandle?.({ remove });
    await mounting;

    expect(remove).toHaveBeenCalledOnce();
    expect(context.browserFinishedHandle).toBeNull();
    expect(addWindowListenerSpy).not.toHaveBeenCalledWith('message', expect.any(Function));
  });
});
