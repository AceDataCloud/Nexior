import { ipcMain, BrowserWindow, dialog } from 'electron';
import { APP_ORIGIN } from '../protocol';
import { consentOk, listGrants, revokeGrant, clearGrants, resetComputerSessionConsent, grantComputerTools, grantToolsWide } from './consent';
import { registry } from './registry';
import { load, save } from './config';
import { setRoots } from './fs';
import { status, openPane, askMedia, promptAccessibility, ensureScreenPermission, type PaneKey } from './permissions';
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

// Panic kill-switch: force Computer Use OFF (persisted + hot-applied at once) so
// a global hotkey can halt all screen capture + input even when the app is
// unfocused. Returns whether it was actually on (for the caller's feedback).
export function disableComputerUse(): boolean {
  const cur = load();
  const wasOn = cur.computerUse === true;
  // Flip the in-memory gate first — that is what actually blocks execution — so
  // a slow/throwing save() can never leave Computer Use live after a panic.
  registry.setComputerUse(false);
  resetComputerSessionConsent(); // re-enabling needs fresh session consent
  if (wasOn) save({ ...cur, computerUse: false });
  return wasOn;
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
    // carries roots + mcp (+ optional computerUse), so merge to avoid wiping
    // the "always allow" list. `computerUse` falls back to the current value
    // when the renderer omits it.
    const cur = load();
    const computerUse = cfg.computerUse ?? cur.computerUse ?? false;
    save({ ...cur, roots: cfg.roots, mcp: cfg.mcp, computerUse });
    setRoots(cfg.roots); // hot-apply roots; MCP server changes apply next launch
    registry.setComputerUse(computerUse); // hot-apply the Computer Use toggle
    if (!computerUse) resetComputerSessionConsent(); // turning it off clears session grants
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

  // Names + descriptions of the computer-use tools, so the renderer can render a
  // per-action always-allow toggle without hardcoding the list.
  ipcMain.handle('local.computerUse.tools', (e) => {
    gate(e);
    return registry.computerToolSpecs();
  });

  // Builtin (fs/shell) tool specs, for the per-tool always-allow toggles.
  ipcMain.handle('local.tools.builtin', (e) => {
    gate(e);
    return registry.builtinToolSpecs();
  });

  // Tool-wide "Always allow" for a builtin tool (shell.run_command, fs.*): persist
  // a bare-name grant so the tool runs for ANY input without a per-call prompt.
  // Native (main-process) confirm — a compromised/XSS'd renderer must NOT be able
  // to silently give itself prompt-less shell/file access; only the user clicking
  // this dialog can. Rejects non-builtin names (no computer/MCP/unknown widening).
  ipcMain.handle('local.grants.grantToolWide', async (e, name: string) => {
    gate(e);
    if (typeof name !== 'string' || !registry.isBuiltinTool(name)) return { grants: listGrants(), ok: false };
    const win = getWin();
    const dangerous = name === 'shell.run_command' || name === 'fs.write_file';
    const detail =
      name === 'shell.run_command'
        ? 'This lets the AI run ANY shell command on this machine WITHOUT asking each time — full access to your files and system. Only enable if you fully trust this. Revoke anytime in Settings → Local Tools.'
        : name === 'fs.write_file'
          ? 'This lets the AI write files WITHOUT asking each time (still limited to your authorized folders). Revoke anytime in Settings → Local Tools.'
          : `This lets the AI run ${name} WITHOUT asking each time (still limited to your authorized folders). Revoke anytime in Settings → Local Tools.`;
    const confirm = {
      type: 'warning' as const,
      buttons: [dangerous ? 'Allow every time (risky)' : 'Allow every time', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: `Always allow ${name} for any input?`,
      detail
    };
    const { response } = win ? await dialog.showMessageBox(win, confirm) : await dialog.showMessageBox(confirm);
    if (response !== 0) return { grants: listGrants(), ok: false };
    return { grants: grantToolsWide([name]), ok: true };
  });

  // Pre-approve computer actions: turn Computer Use on, persist an always-allow
  // grant for the requested computer.* tools (or ALL when `names` is empty), and
  // trigger the macOS Screen Recording + Accessibility prompts up front so the
  // first real action doesn't stall. Returns the new grant list + permission
  // status to refresh UI.
  ipcMain.handle('local.computerUse.preauthorize', async (e, names?: string[]) => {
    gate(e);
    const win = getWin();
    // Only ever grant real computer.* tools — never widen an fs/shell grant.
    const all = registry.computerToolNames();
    const targets = Array.isArray(names) && names.length ? names.filter((n) => all.includes(n)) : all;
    if (!targets.length) return { grants: listGrants(), perm: status(), computerUse: load().computerUse === true };
    const grantingAll = targets.length === all.length;
    // Native (main-process) confirmation. The renderer can request this, but a
    // compromised/XSS'd page must NOT be able to silently grant itself permanent
    // screen + input control — only the user clicking this native dialog can.
    const confirm = {
      type: 'warning' as const,
      buttons: [grantingAll ? 'Enable & allow all' : 'Enable & allow', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: grantingAll ? 'Pre-approve all computer actions?' : `Always allow ${targets.join(', ')}?`,
      detail:
        (grantingAll
          ? 'This lets the AI take screenshots and control your mouse & keyboard'
          : `This lets the AI run ${targets.join(', ')}`) +
        ' WITHOUT asking each time — until you revoke it in Settings → Local Tools or press the panic hotkey (Cmd/Ctrl+Alt+Shift+P).'
    };
    const { response } = win ? await dialog.showMessageBox(win, confirm) : await dialog.showMessageBox(confirm);
    if (response !== 0) return { grants: listGrants(), perm: status(), computerUse: load().computerUse === true };
    const cur = load();
    if (cur.computerUse !== true) save({ ...cur, computerUse: true });
    registry.setComputerUse(true);
    const grants = grantComputerTools(targets);
    await ensureScreenPermission(); // capture permission (no-op off macOS)
    promptAccessibility(); // input permission
    // Re-read computerUse: a panic hotkey fired DURING the awaits above would
    // have disabled it, so don't report a stale `true` the UI could re-persist.
    return { grants, perm: status(), computerUse: load().computerUse === true };
  });
}
