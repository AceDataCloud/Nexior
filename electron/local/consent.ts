import { dialog, BrowserWindow } from 'electron';
import type { ToolInvoke } from './types';
import { load, save } from './config';

// No OS sandbox by design — consent is the control. Three tiers:
//   • Allow once     — run this one time.
//   • Allow for session — cache in-memory for this app run (reads only;
//                      mutating tools still re-confirm).
//   • Always allow   — persist a session-independent grant to disk so the
//                      exact (tool, input) never prompts again — even for
//                      mutating tools, because the user explicitly opted in
//                      for that precise call. Revocable from Settings.
// The full argv/path is shown untruncated so the dangerous part can't hide.
const sessionGranted = new Set<string>();

// Deep-stable stringify: recursively sorts object keys at EVERY level so
// equivalent inputs map to the same grant key regardless of property order.
// Must NOT use the `JSON.stringify(v, keysArray)` replacer form — that filters
// keys at all depths and silently DROPS nested fields, which would collapse
// `{cfg:{path:'/safe'}}` and `{cfg:{path:'/danger'}}` to the same key and let an
// Always-allow grant leak to a different, dangerous call.
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const obj = v as Record<string, unknown>;
  return (
    '{' +
    Object.keys(obj)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k]))
      .join(',') +
    '}'
  );
}

function stable(input: Record<string, unknown>): string {
  return stableStringify(input ?? {});
}

// Per-run key (includes sessionId) for the "Allow for session" cache.
function sessionKey(inv: ToolInvoke): string {
  return `${inv.sessionId}:${inv.name}:${stable(inv.input)}`;
}

// Session-independent key for persistent "Always allow" grants. Scoped to the
// EXACT tool + input, so always-allowing `ls /Desktop` never auto-runs `rm`.
export function grantKey(inv: ToolInvoke): string {
  return `${inv.name}:${stable(inv.input)}`;
}

export async function consentOk(inv: ToolInvoke, win: BrowserWindow | null, mutates: boolean): Promise<boolean> {
  // Computer-use tools (screen capture + mouse/keyboard injection) are too
  // sensitive to ever auto-run silently: their grant key is often constant
  // (e.g. `computer.screenshot:{}`), so a single persistent "Always allow"
  // would hand the AI permanent promptless control of the screen. Until a
  // dedicated session-scoped computer-use consent lands (see plan Phase 3),
  // they are NOT persistable — no permanent grant, no "Always allow" button.
  const persistable = !inv.name.startsWith('computer.');
  const gk = grantKey(inv);
  if (persistable && (load().grants ?? []).includes(gk)) return true; // persistent always-allow
  if (sessionGranted.has(sessionKey(inv)) && !mutates) return true;
  const buttons = persistable
    ? ['Allow once', 'Allow for session', 'Always allow', 'Deny']
    : ['Allow once', 'Allow for session', 'Deny'];
  const denyId = buttons.length - 1;
  const opts = {
    type: 'warning' as const,
    buttons,
    defaultId: 0,
    cancelId: denyId,
    message: `Run local tool: ${inv.name}?`,
    detail: JSON.stringify(inv.input)
  };
  const { response } = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (response === 1) sessionGranted.add(sessionKey(inv));
  if (persistable && response === 2) {
    const cfg = load();
    const grants = new Set(cfg.grants ?? []);
    grants.add(gk);
    save({ ...cfg, grants: [...grants] });
  }
  return response !== denyId;
}

export function resetConsent(): void {
  sessionGranted.clear();
}

// Persistent-grant management, surfaced in Settings → Local Tools.
export function listGrants(): string[] {
  return load().grants ?? [];
}

export function revokeGrant(key: string): void {
  const cfg = load();
  save({ ...cfg, grants: (cfg.grants ?? []).filter((g) => g !== key) });
}

export function clearGrants(): void {
  const cfg = load();
  save({ ...cfg, grants: [] });
}
