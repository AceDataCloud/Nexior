import { autoUpdater } from 'electron-updater';
import { dialog, type BrowserWindow } from 'electron';

/**
 * electron-updater against the COS-hosted feed (configured via
 * electron-builder.yml `publish: generic`). Replaces the Capacitor OTA path,
 * which does not apply to Electron.
 *
 * Fails open: an update error never blocks boot. `autoInstallOnAppQuit` stays
 * OFF until signing + feed are verified end to end (a mis-channeled / unsigned
 * artifact must not auto-stage). Flip it on once the signed beta round-trip
 * passes.
 */
export function initUpdater(getWindow: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-downloaded', async (info) => {
    const win = getWindow();
    if (!win) return;
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      message: `Update ${info.version} ready`,
      detail: 'Restart to apply the update.'
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => console.warn('[updater] error', err));

  autoUpdater.checkForUpdates().catch((e) => console.warn('[updater] check failed', e));
}
