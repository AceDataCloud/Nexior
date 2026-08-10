import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  packaged: true,
  handlers: new Map<string, (...args: any[]) => void>(),
  check: vi.fn(),
  install: vi.fn()
}));

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return mocks.packaged;
    },
    getVersion: () => '1.0.0'
  }
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    autoInstallOnAppQuit: true,
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      mocks.handlers.set(event, cb);
    }),
    checkForUpdates: mocks.check,
    quitAndInstall: mocks.install
  }
}));

async function loadUpdater() {
  vi.resetModules();
  return import('./updater');
}

describe('desktop updater', () => {
  beforeEach(() => {
    mocks.packaged = true;
    mocks.handlers.clear();
    mocks.check.mockReset().mockResolvedValue({ updateInfo: { version: '1.1.0' } });
    mocks.install.mockReset();
  });

  it('deduplicates concurrent checks', async () => {
    let resolveCheck: ((value: unknown) => void) | undefined;
    mocks.check.mockImplementation(() => new Promise((resolve) => (resolveCheck = resolve)));
    const updater = await loadUpdater();
    updater.initUpdater(() => null);
    const first = updater.checkForUpdates();
    const second = updater.checkForUpdates();
    expect(first).toBe(second);
    resolveCheck?.({ updateInfo: { version: '1.1.0' } });
    await first;
    expect(mocks.check).toHaveBeenCalledOnce();
  });

  it('tracks progress and only installs a downloaded update', async () => {
    const updater = await loadUpdater();
    updater.initUpdater(() => null);
    expect(updater.installDownloadedUpdate()).toBe(false);
    mocks.handlers.get('update-available')?.({ version: '1.1.0' });
    mocks.handlers.get('download-progress')?.({ percent: 42.4 });
    expect(updater.getUpdaterState()).toMatchObject({ phase: 'downloading', percent: 42, availableVersion: '1.1.0' });
    mocks.handlers.get('update-downloaded')?.({ version: '1.1.0' });
    expect(updater.installDownloadedUpdate()).toBe(true);
    expect(mocks.install).toHaveBeenCalledWith(false, true);
  });

  it('returns unsupported outside a packaged app', async () => {
    mocks.packaged = false;
    const updater = await loadUpdater();
    updater.initUpdater(() => null);
    expect(await updater.checkForUpdates()).toMatchObject({ phase: 'unsupported', currentVersion: '1.0.0' });
    expect(mocks.check).not.toHaveBeenCalled();
  });
});
