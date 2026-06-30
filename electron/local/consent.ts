import { dialog, BrowserWindow } from 'electron';
import type { ToolInvoke } from './types';
import { load, save } from './config';
import { authorizeConsentedPath } from './fs';

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

// Bridge consent → the fs allowlist. Approving the popup for a file tool used to
// grant only the *right to run the call*; fs.ts then independently rejected any
// path not separately added in Settings ("path outside allowed roots"). Here we
// authorize the exact path the user approved so the call can actually proceed.
// `persist` (Always allow) additionally writes the granted dir to config.roots
// so it survives a restart; once/session authorize in-memory only.
function grantPathAccess(inv: ToolInvoke, persist: boolean): void {
  if (!inv.name.startsWith('fs.')) return;
  const p = (inv.input as Record<string, unknown> | undefined)?.path;
  if (typeof p !== 'string' || !p) return;
  const dir = authorizeConsentedPath(inv.name, p);
  if (dir && persist) {
    const cfg = load();
    const roots = new Set(cfg.roots ?? []);
    roots.add(dir);
    save({ ...cfg, roots: [...roots] });
  }
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
  // Cached grants must NOT re-authorize the path here. Re-running
  // authorizeConsentedPath() would realpath the CURRENT target, so a symlink
  // approved once could be retargeted afterwards to slip a no-prompt grant onto
  // a new location — defeating the realpath boundary. Authorization is bound at
  // approval time only: "Always allow" already persisted its canonical dir to
  // config.roots (loaded into ROOTS on launch); "Allow for session" keeps its
  // SESSION_ROOTS entry for the run. (Grants created before this change have no
  // persisted root, so they re-prompt once — which then persists it.)
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
  // Authorize the approved path (fs.* tools), bound to its realpath AT APPROVAL
  // TIME — the subsequent read/list/write re-realpaths and re-checks inRootDir,
  // so a symlink swapped between here and the call is still caught. Only
  // "Always allow" (response 2, persistable) persists the canonical dir as a root.
  if (response !== denyId) grantPathAccess(inv, persistable && response === 2);
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
