import { dialog, BrowserWindow } from 'electron';
import type { ToolInvoke } from './types';
import { load, save } from './config';
import { authorizeConsentedPath } from './fs';

// No OS sandbox by design — consent is the control. Three tiers:
//   • Allow once     — run this one time.
//   • Allow for session — cache in-memory for this app run; cleared on restart.
//                      Non-computer mutating tools still re-confirm; computer.*
//                      honors it (mutation is the point) so a screenshot→act
//                      loop isn't a per-step prompt storm.
//   • Always allow   — persist a session-independent grant to disk so the call
//                      never prompts again — even for mutating tools, because
//                      the user explicitly opted in. Revocable from Settings.
// fs/shell grants are bound to the EXACT input; computer.* grants are name-
// scoped (their inputs — mouse coords, typed text — vary every call, so an
// input-scoped grant would never match twice). A computer.* "Always allow" is
// thus an explicit opt-in to prompt-less screen control; the panic hotkey still
// hard-disables Computer Use regardless (the registry gate blocks every
// computer.* call before consent runs).
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

// Per-run key (includes sessionId) for the "Allow for session" cache. Computer
// tools are name-scoped (inputs vary every call); everything else is input-bound.
function sessionKey(inv: ToolInvoke): string {
  if (inv.name.startsWith('computer.')) return `${inv.sessionId}:${inv.name}`;
  return `${inv.sessionId}:${inv.name}:${stable(inv.input)}`;
}

// Session-independent key for persistent "Always allow" grants. fs/shell grants
// are scoped to the EXACT tool + input, so always-allowing `ls /Desktop` never
// auto-runs `rm`. computer.* grants are name-scoped (see file header).
export function grantKey(inv: ToolInvoke): string {
  if (inv.name.startsWith('computer.')) return inv.name;
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
  const isComputer = inv.name.startsWith('computer.');
  const gk = grantKey(inv);
  // Cached grants must NOT re-authorize the path here. Re-running
  // authorizeConsentedPath() would realpath the CURRENT target, so a symlink
  // approved once could be retargeted afterwards to slip a no-prompt grant onto
  // a new location — defeating the realpath boundary. Authorization is bound at
  // approval time only: "Always allow" already persisted its canonical dir to
  // config.roots (loaded into ROOTS on launch); "Allow for session" keeps its
  // SESSION_ROOTS entry for the run. (Grants created before this change have no
  // persisted root, so they re-prompt once — which then persists it.)
  if ((load().grants ?? []).includes(gk)) return true; // persistent always-allow
  // Non-computer mutating tools still re-confirm; computer.* honors its (name-
  // scoped) session grant even though it mutates — that is the whole point of
  // "Allow for session" for a screen-control loop.
  if (sessionGranted.has(sessionKey(inv)) && (isComputer || !mutates)) return true;
  const buttons = ['Allow once', 'Allow for session', 'Always allow', 'Deny'];
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
  if (response === 2) {
    const cfg = load();
    const grants = new Set(cfg.grants ?? []);
    grants.add(gk);
    save({ ...cfg, grants: [...grants] });
  }
  // Authorize the approved path (fs.* tools), bound to its realpath AT APPROVAL
  // TIME — the subsequent read/list/write re-realpaths and re-checks inRootDir,
  // so a symlink swapped between here and the call is still caught. Only
  // "Always allow" (response 2) persists the canonical dir as a root.
  if (response !== denyId) grantPathAccess(inv, response === 2);
  return response !== denyId;
}

export function resetConsent(): void {
  sessionGranted.clear();
}

// Drop only the computer-use "Allow for session" grants — called when Computer
// Use is turned off (panic hotkey or the Settings toggle) so re-enabling
// requires fresh session consent. Persistent "Always allow" grants survive by
// design; revoke those in Settings.
export function resetComputerSessionConsent(): void {
  // Match the NAME segment only (sessionKey is `<sessionId>:computer.<tool>`,
  // sessionId is a colon-free uuid) so an fs/shell grant whose serialized input
  // happens to contain ":computer." is never collaterally cleared.
  for (const k of [...sessionGranted]) {
    if (/^[^:]+:computer\./.test(k)) sessionGranted.delete(k);
  }
}

// Persistent-grant management, surfaced in Settings → Local Tools.
export function listGrants(): string[] {
  return load().grants ?? [];
}

// Pre-approve the given tools as persistent "Always allow" grants in one shot
// (used by "pre-approve all computer actions"). Only computer.* names are
// accepted — their grant key IS the bare tool name (see grantKey) — so this can
// never widen an fs/shell grant beyond its exact input. Idempotent.
export function grantComputerTools(names: string[]): string[] {
  const cfg = load();
  const grants = new Set(cfg.grants ?? []);
  for (const n of names) if (n.startsWith('computer.')) grants.add(n);
  save({ ...cfg, grants: [...grants] });
  return [...grants];
}

export function revokeGrant(key: string): void {
  const cfg = load();
  save({ ...cfg, grants: (cfg.grants ?? []).filter((g) => g !== key) });
}

export function clearGrants(): void {
  const cfg = load();
  save({ ...cfg, grants: [] });
}
