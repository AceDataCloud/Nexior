import { ipcMain, BrowserWindow, dialog } from 'electron';
import { APP_ORIGIN } from '../protocol';
import { consentOk, listGrants, revokeGrant, clearGrants } from './consent';
import { registry } from './registry';
import { load, save } from './config';
import { setRoots } from './fs';
import { status, openPane, askMedia, promptAccessibility, type PaneKey } from './permissions';
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
    // Preserve persistent consent grants — the renderer's save payload only
    // carries roots + mcp, so merge to avoid wiping the "always allow" list.
    const cur = load();
    save({ ...cur, roots: cfg.roots, mcp: cfg.mcp });
    setRoots(cfg.roots); // hot-apply roots; MCP server changes apply next launch
    return true;
  });
  ipcMain.handle('local.pickFolder', async (e) => {
    gate(e);
    const win = getWin();
    const r = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return r.canceled ? null : r.filePaths[0];
  });

  // macOS TCC permission status + System Settings deep-links, surfaced in the
  // shared LocalTools panel. No-ops off macOS (renderer hides the section).
  ipcMain.handle('local.perm.status', (e) => {
    gate(e);
    return status();
  });
  ipcMain.handle('local.perm.openPane', (e, k: PaneKey) => {
    gate(e);
    if (k === 'accessibility') promptAccessibility();
    openPane(k);
    return true;
  });
  ipcMain.handle('local.perm.askMedia', (e, t: 'camera' | 'microphone') => {
    gate(e);
    return askMedia(t);
  });

  // Persistent "always allow" consent grants — list / revoke / clear from
  // Settings → Local Tools. Revoking re-arms the per-call confirmation.
  ipcMain.handle('local.grants.list', (e) => {
    gate(e);
    return listGrants();
  });
  ipcMain.handle('local.grants.revoke', (e, key: string) => {
    gate(e);
    revokeGrant(key);
    return true;
  });
  ipcMain.handle('local.grants.clear', (e) => {
    gate(e);
    clearGrants();
    return true;
  });
}
