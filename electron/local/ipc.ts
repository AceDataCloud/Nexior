import { ipcMain, BrowserWindow, dialog } from 'electron';
import { APP_ORIGIN } from '../protocol';
import { consentOk } from './consent';
import { registry } from './registry';
import { load, save } from './config';
import { setRoots } from './fs';
import type { LocalConfig, ToolInvoke } from './types';

// Only the top-frame app://bundle renderer may drive local execution. Compare
// parsed origins (not startsWith) so app://bundle.evil can't slip through. A
// compromised/XSS'd renderer still hits per-tool consent before anything runs.
function sameOrigin(url: string | undefined): boolean {
  try {
    return !!url && new URL(url).origin === new URL(APP_ORIGIN).origin;
  } catch {
    return false;
  }
}

export function registerLocalExec(getWin: () => BrowserWindow | null): void {
  const gate = (e: Electron.IpcMainInvokeEvent) => {
    if (!sameOrigin(e.senderFrame?.url)) throw new Error('local-exec: bad sender origin');
  };

  ipcMain.handle('local.tools.list', (e) => {
    gate(e);
    return registry.specs();
  });

  ipcMain.handle('local.tool.invoke', async (e, inv: ToolInvoke) => {
    gate(e);
    if (!registry.isKnown(inv.name)) return { output: `unknown tool ${inv.name}`, is_error: true };
    const mutates = inv.name !== 'fs.read_file' && inv.name !== 'fs.list_dir';
    if (!(await consentOk(inv, getWin(), mutates))) return { output: 'denied by user', is_error: true };
    return registry.invoke(inv);
  });

  ipcMain.handle('local.config.get', (e) => {
    gate(e);
    return load();
  });
  ipcMain.handle('local.config.save', (e, cfg: LocalConfig) => {
    gate(e);
    save(cfg);
    setRoots(cfg.roots); // hot-apply roots; MCP server changes apply next launch
    return true;
  });
  ipcMain.handle('local.pickFolder', async (e) => {
    gate(e);
    const win = getWin();
    const r = win ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] }) : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });
}
