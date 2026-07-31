import { dialog, BrowserWindow } from 'electron';
import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, sep } from 'node:path';
import type { ToolInvoke } from './types';
import { load, save } from './config';
import { dirGrantCovers, dirGrantKey, invocationDir } from './dirGrants';
import { authorizeConsentedPath, revokeOnceRoot } from './fs';

// No OS sandbox by design — consent is the control. Three tiers:
//   • Allow once     — run this one time. An fs folder grant is revoked as soon
//                      as the call finishes.
//   • Allow for session — cache in-memory for this app run; cleared on restart.
//                      Honored by EVERY tool, mutating included: the key is
//                      input-bound (except computer.*), so it only skips the
//                      prompt for a byte-identical repeat of what was approved.
//   • Always allow   — persist a session-independent grant to disk so the call
//                      never prompts again. Revocable from Settings.
// fs/shell grants are bound to the EXACT input; computer.* grants are name-
// scoped (their inputs — mouse coords, typed text — vary every call, so an
// input-scoped grant would never match twice). A computer.* "Always allow" is
// thus an explicit opt-in to prompt-less screen control; the panic hotkey still
// hard-disables Computer Use regardless (the registry gate blocks every
// computer.* call before consent runs).
// For fs.* the approval authorizes the containing FOLDER (read + write), which
// the dialog states outright — one file is rarely the useful unit of work, and
// a file-scoped grant would re-prompt for every sibling.
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
// authorize the FOLDER the approved path lives in so the call can proceed and
// its siblings don't each re-prompt. `persist` (Always allow) additionally
// writes the granted dir to config.roots so it survives a restart;
// once/session authorize in-memory only. Returns the granted dir so the caller
// can revoke it again after a one-shot ("Allow once") approval.
function grantPathAccess(inv: ToolInvoke, persist: boolean, once: boolean): string | null {
  if (!inv.name.startsWith('fs.')) return null;
  const p = (inv.input as Record<string, unknown> | undefined)?.path;
  if (typeof p !== 'string' || !p) return null;
  const dir = authorizeConsentedPath(inv.name, p, once);
  if (dir && persist) {
    const cfg = load();
    const roots = new Set(cfg.roots ?? []);
    roots.add(dir);
    save({ ...cfg, roots: [...roots] });
  }
  return dir;
}

// The folder an fs.* call would authorize, resolved WITHOUT granting anything —
// so the dialog can name the real scope before the user decides. Mirrors
// authorizeConsentedPath's dir choice; falls back to the lexical dirname when
// the path can't be realpath'd (e.g. a write whose parent is a broken symlink),
// which is still the honest scope to show.
function consentScopeDir(inv: ToolInvoke): string | null {
  if (!inv.name.startsWith('fs.')) return null;
  const p = (inv.input as Record<string, unknown> | undefined)?.path;
  if (typeof p !== 'string' || !p) return null;
  const expanded = p === '~' ? homedir() : p.startsWith('~/') || p.startsWith('~\\') ? join(homedir(), p.slice(2)) : p;
  const target = inv.name === 'fs.list_dir' ? expanded : dirname(expanded);
  try {
    return realpathSync(target);
  } catch {
    return target;
  }
}

// Render the dialog's detail text. The full argv/path stays untruncated so the
// dangerous part can't hide, but a big `content` (fs.write_file can carry a
// whole file) is summarized — it would otherwise push the buttons off screen.
// For fs.* the granted FOLDER is stated explicitly, because approving grants
// read+write across that folder, not just the one path in the input.
function consentDetail(inv: ToolInvoke, scopeDir: string | null, dirTarget: string | null): string {
  const input = (inv.input ?? {}) as Record<string, unknown>;
  const shown: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    shown[k] = typeof v === 'string' && v.length > 400 ? `<${v.length} characters>` : v;
  }
  const lines = [JSON.stringify(shown)];
  if (scopeDir) {
    lines.push('', `Approving grants read + write access to this folder and everything inside it:\n${scopeDir}`);
  }
  // Spell out the repeat semantics: a session/always grant re-runs this exact
  // call without asking again, which for a non-idempotent tool (sending,
  // posting, deleting) means the side effect can happen more than once.
  lines.push(
    '',
    '"Allow for session" and "Always allow" re-run this exact call without asking again — if it sends, posts or deletes something, that can happen again.'
  );
  if (dirTarget) {
    lines.push(
      '',
      `"Always allow in …" is broader: ANY ${inv.name} call under ${dirTarget} runs without asking, including commands you have not seen yet. It stays limited to that folder.`
    );
  }
  return lines.join('\n');
}

// A no-op release, shared by every decision that grants nothing to undo.
const NO_RELEASE = (): void => undefined;

/** Outcome of a consent check. `release` undoes an "Allow once" folder grant and
 *  MUST be called after the invocation (see ipc.ts's `finally`); it is a no-op
 *  for every other decision. Per-invocation, so parallel calls can't revoke
 *  each other's grant. */
export interface ConsentDecision {
  ok: boolean;
  release: () => void;
}

// Keep the button label readable: a deep path would be truncated by the OS
// dialog anyway, and the full folder is spelled out in the detail text.
function shortDir(dir: string): string {
  const home = homedir();
  const shown = dir === home || dir.startsWith(home + sep) ? '~' + dir.slice(home.length) : dir;
  return shown.length > 40 ? '…' + shown.slice(-39) : shown;
}

export async function consentOk(inv: ToolInvoke, win: BrowserWindow | null): Promise<ConsentDecision> {
  const gk = grantKey(inv);
  // Cached grants must NOT re-authorize the path here. Re-running
  // authorizeConsentedPath() would realpath the CURRENT target, so a symlink
  // approved once could be retargeted afterwards to slip a no-prompt grant onto
  // a new location — defeating the realpath boundary. Authorization is bound at
  // approval time only: "Always allow" already persisted its canonical dir to
  // config.roots (loaded into ROOTS on launch); "Allow for session" keeps its
  // SESSION_ROOTS entry for the run. (Grants created before this change have no
  // persisted root, so they re-prompt once — which then persists it.)
  if ((load().grants ?? []).includes(gk)) return { ok: true, release: NO_RELEASE }; // persistent always-allow
  // Tool-wide always-allow: a grant stored as the BARE tool name (no `:input`)
  // means "run this tool for ANY input without asking" — opted in per-tool from
  // Settings → Local Tools. For computer.* the grant key already IS the bare
  // name (handled above); this line extends the same name-scoping to builtin
  // tools (shell.run_command, fs.*). fs.* still enforces its ROOTS boundary in
  // fs.ts, so a tool-wide fs grant can't escape the authorized folders; a
  // tool-wide shell grant is unrestricted by design (the Settings toggle warns).
  if (inv.name !== gk && (load().grants ?? []).includes(inv.name)) return { ok: true, release: NO_RELEASE };
  // "Allow for session" applies to EVERY tool, mutating included. The key is
  // input-bound for fs/shell/mcp (sessionKey), so this only skips the prompt for
  // a byte-identical repeat of what the user already approved — re-running the
  // same command, not a new one. It used to be gated on `!mutates`, which made
  // the button dead for shell/write/MCP: it cached a grant that was then never
  // honored, so those tools prompted on every single call.
  if (sessionGranted.has(sessionKey(inv))) return { ok: true, release: NO_RELEASE };
  // Directory-scoped grant: "this tool, anywhere under this folder". The middle
  // tier between an input-bound grant (re-prompts on every new command) and a
  // bare tool-wide one (unrestricted). See dirGrants.ts.
  if (dirGrantCovers(load().grants ?? [], inv)) return { ok: true, release: NO_RELEASE };
  const scopeDir = consentScopeDir(inv);
  // Offer the directory tier only when the call actually names a directory —
  // otherwise the button would grant something the user can't see.
  const dirTarget = invocationDir(inv);
  const buttons = dirTarget
    ? ['Allow once', 'Allow for session', `Always allow in ${shortDir(dirTarget)}`, 'Always allow (any path)', 'Deny']
    : ['Allow once', 'Allow for session', 'Always allow', 'Deny'];
  const denyId = buttons.length - 1;
  const dirBtn = dirTarget ? 2 : -1;
  const alwaysBtn = dirTarget ? 3 : 2;
  const opts = {
    type: 'warning' as const,
    buttons,
    defaultId: 0,
    cancelId: denyId,
    message: `Run local tool: ${inv.name}?`,
    detail: consentDetail(inv, scopeDir, dirTarget)
  };
  const { response } = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
  if (response === 1) sessionGranted.add(sessionKey(inv));
  if (response === dirBtn && dirTarget) {
    // Directory-scoped: persist `dir:<tool>:<dir>`, NOT the input-bound key —
    // the whole point is that a different command in the same folder is covered.
    const cfg = load();
    const grants = new Set(cfg.grants ?? []);
    grants.add(dirGrantKey(inv.name, dirTarget));
    save({ ...cfg, grants: [...grants] });
  }
  if (response === alwaysBtn) {
    const cfg = load();
    const grants = new Set(cfg.grants ?? []);
    grants.add(gk);
    save({ ...cfg, grants: [...grants] });
  }
  // Authorize the approved path's FOLDER (fs.* tools), bound to its realpath AT
  // APPROVAL TIME — the subsequent read/list/write re-realpaths and re-checks
  // inRootDir, so a symlink swapped between here and the call is still caught.
  // Both persistent tiers (directory-scoped and always) persist the canonical
  // dir as a root; "once"/"session" authorize in memory only.
  if (response === denyId) return { ok: false, release: NO_RELEASE };
  const once = response === 0;
  const granted = grantPathAccess(inv, response === alwaysBtn || response === dirBtn, once);
  // "Allow once" means once: the caller releases this specific hold after the
  // call. The handle is per-invocation (not a shared queue), so a parallel call
  // approved for the same folder keeps its own reference-counted grant.
  if (once && granted) return { ok: true, release: () => revokeOnceRoot(granted) };
  return { ok: true, release: NO_RELEASE };
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

// Persist a tool-wide "Always allow" grant as the BARE tool name (any input) for
// the given builtin tools — used by the per-tool always-allow toggles in
// Settings. The caller (ipc) MUST validate each name is a real registered
// builtin tool so this can never grant an unknown name by accident.
export function grantToolsWide(names: string[]): string[] {
  const cfg = load();
  const grants = new Set(cfg.grants ?? []);
  for (const n of names) grants.add(n);
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
