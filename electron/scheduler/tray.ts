import { app, Menu, Tray, nativeImage, shell } from 'electron';
import path from 'node:path';
import { daemon, type DaemonState } from './daemon';
import { getDeviceName } from './credentials';

/**
 * The tray icon: the app's only visible presence once its window is closed.
 *
 * Without it, staying resident to fire local tasks would be indistinguishable
 * from failing to quit — the user closes the window, the process lives on, and
 * nothing on screen explains why or offers a way out. Every resident state has
 * a menu entry, including Quit.
 */

let tray: Tray | null = null;

function trayIcon(): Electron.NativeImage {
  // Loaded from `electron/dist/assets/` (populated by scripts/copy-tray-assets.js),
  // NOT from `build/`: that directory is buildResources, read at package time and
  // never shipped, so a runtime path into it resolves to nothing inside the .app
  // and Tray silently renders an empty image — a resident app with no menu-bar
  // icon and no reachable Quit item.
  //
  // The macOS image is a black-on-transparent template so the system can invert
  // it for dark menu bars; Windows/Linux take the colour icon as-is.
  const file = process.platform === 'darwin' ? 'trayTemplate.png' : 'icon.png';
  const img = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', file));
  if (process.platform === 'darwin') img.setTemplateImage(true);
  return img.isEmpty() ? nativeImage.createEmpty() : img;
}

function formatNext(nextAt: number | null): string {
  if (nextAt === null) return 'no further runs';
  const deltaSec = nextAt - Math.floor(Date.now() / 1000);
  if (deltaSec <= 0) return 'due now';
  if (deltaSec < 3600) return `in ${Math.max(1, Math.round(deltaSec / 60))} min`;
  if (deltaSec < 86400) return `in ${Math.round(deltaSec / 3600)} h`;
  return new Date(nextAt * 1000).toLocaleString();
}

function stateLabel(state: DaemonState, error?: string): string {
  if (state === 'signed_out') return 'Signed out — open AceData to sign in';
  if (state === 'stopped') return 'Scheduled tasks paused';
  if (error) return `Last sync failed: ${error.slice(0, 60)}`;
  const name = getDeviceName();
  return name ? `Running on ${name}` : 'Running on this device';
}

export function initTray(showWindow: () => void): void {
  if (tray) return;
  tray = new Tray(trayIcon());
  tray.setToolTip('AceData');
  tray.on('click', () => showWindow());
  daemon.setStateListener(() => refreshTray(showWindow));
  refreshTray(showWindow);
}

export function refreshTray(showWindow: () => void): void {
  if (!tray) return;
  const { state, error } = daemon.getState();
  const schedule = daemon.getSchedule();

  const taskItems: Electron.MenuItemConstructorOptions[] = schedule.length
    ? schedule.slice(0, 10).map((t) => ({
        label: `${t.name} — ${formatNext(t.nextAt)}`,
        enabled: false
      }))
    : [{ label: 'No tasks on this device', enabled: false }];

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: stateLabel(state, error), enabled: false },
      { type: 'separator' },
      ...taskItems,
      { type: 'separator' },
      { label: 'Open AceData', click: () => showWindow() },
      {
        label: state === 'stopped' ? 'Resume scheduled tasks' : 'Pause scheduled tasks',
        click: () => {
          if (state === 'stopped') daemon.start();
          else daemon.stop();
          refreshTray(showWindow);
        }
      },
      { type: 'separator' },
      {
        label: 'Start at login',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => setOpenAtLogin(item.checked)
      },
      {
        label: 'Manage tasks…',
        click: () => {
          showWindow();
          void shell.openExternal('https://studio.acedata.cloud/chatgpt/scheduled').catch(() => {});
        }
      },
      { type: 'separator' },
      // Without this the app would be genuinely unquittable once the window is
      // closed on Windows.
      { label: 'Quit AceData', click: () => app.quit() }
    ])
  );
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function setOpenAtLogin(enabled: boolean): void {
  // `openAsHidden` (macOS) starts without stealing a window on boot — the point
  // is to be there for the schedule, not to greet the user.
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true });
}

export function isOpenAtLogin(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
