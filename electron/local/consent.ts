import { dialog, BrowserWindow } from 'electron';
import type { ToolInvoke } from './types';

// No OS sandbox by design — consent is the control. Reads can be cached per
// (session,tool,path); mutating tools (write/exec) always re-confirm. The full
// argv/path is shown untruncated so the dangerous part can't hide.
const granted = new Set<string>();

function key(inv: ToolInvoke): string {
  return `${inv.sessionId}:${inv.name}:${JSON.stringify(inv.input)}`;
}

export async function consentOk(inv: ToolInvoke, win: BrowserWindow | null, mutates: boolean): Promise<boolean> {
  if (granted.has(key(inv)) && !mutates) return true;
  const opts = {
    type: 'warning' as const,
    buttons: ['Allow once', 'Allow for session', 'Deny'],
    defaultId: 0,
    cancelId: 2,
    message: `Run local tool: ${inv.name}?`,
    detail: JSON.stringify(inv.input)
  };
  const { response } = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (response === 1) granted.add(key(inv));
  return response !== 2;
}

export function resetConsent(): void {
  granted.clear();
}
