import { app, type BrowserWindow } from 'electron';
import { autoUpdater, type UpdateInfo } from 'electron-updater';

export type UpdaterPhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'
  | 'unsupported';

export interface UpdaterState {
  phase: UpdaterPhase;
  currentVersion: string;
  availableVersion?: string;
  percent?: number;
  errorCode?: 'feed_unavailable' | 'network_error' | 'update_failed';
}

type WindowGetter = () => BrowserWindow | null;

let getWindow: WindowGetter = () => null;
let initialized = false;
let checking: Promise<UpdaterState> | null = null;
let state: UpdaterState = {
  phase: 'idle',
  currentVersion: app.getVersion()
};

function snapshot(): UpdaterState {
  return { ...state };
}

function publish(next: UpdaterState): void {
  state = next;
  const win = getWindow();
  if (win && !win.isDestroyed()) win.webContents.send('updater:state', snapshot());
}

function withVersion(phase: UpdaterPhase, info?: UpdateInfo): UpdaterState {
  return {
    phase,
    currentVersion: app.getVersion(),
    ...(info?.version ? { availableVersion: info.version } : {})
  };
}

function classifyError(error: Error): UpdaterState['errorCode'] {
  const message = error.message.toLowerCase();
  if (message.includes('404') || message.includes('not found') || message.includes('nosuchkey')) {
    return 'feed_unavailable';
  }
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econn') ||
    message.includes('enotfound')
  ) {
    return 'network_error';
  }
  return 'update_failed';
}

export function initUpdater(windowGetter: WindowGetter): void {
  getWindow = windowGetter;
  state = withVersion(app.isPackaged ? 'idle' : 'unsupported');
  if (initialized || !app.isPackaged) return;
  initialized = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => publish(withVersion('checking')));
  autoUpdater.on('update-available', (info) => publish(withVersion('available', info)));
  autoUpdater.on('update-not-available', () => publish(withVersion('up-to-date')));
  autoUpdater.on('download-progress', (progress) => {
    publish({
      phase: 'downloading',
      currentVersion: app.getVersion(),
      availableVersion: state.availableVersion,
      percent: Math.max(0, Math.min(100, Math.round(progress.percent)))
    });
  });
  autoUpdater.on('update-downloaded', (info) => publish(withVersion('downloaded', info)));
  autoUpdater.on('error', (error) => {
    console.warn('[updater] error', error);
    publish({
      phase: 'error',
      currentVersion: app.getVersion(),
      errorCode: classifyError(error)
    });
  });

  void checkForUpdates();
}

export function getUpdaterState(): UpdaterState {
  return snapshot();
}

export function checkForUpdates(): Promise<UpdaterState> {
  if (!app.isPackaged) {
    publish(withVersion('unsupported'));
    return Promise.resolve(snapshot());
  }
  if (checking) return checking;
  if (state.phase === 'downloading' || state.phase === 'downloaded') return Promise.resolve(snapshot());

  checking = autoUpdater
    .checkForUpdates()
    .then(() => snapshot())
    .catch((error: Error) => {
      if (state.phase !== 'error') {
        publish({
          phase: 'error',
          currentVersion: app.getVersion(),
          errorCode: classifyError(error)
        });
      }
      return snapshot();
    })
    .finally(() => {
      checking = null;
    });
  return checking;
}

export function installDownloadedUpdate(): boolean {
  if (state.phase !== 'downloaded') return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
}
