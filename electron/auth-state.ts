import { randomUUID } from 'node:crypto';

/**
 * OAuth `state` nonce store for the desktop deep-link callback.
 *
 * Threat: `acedata-desktop://` is registered as a default protocol, so ANY
 * local process/web page can invoke `acedata-desktop://auth/callback?code=...`.
 * Dedup alone only blocks replay of the SAME code, not a foreign/phished one.
 * We bind each login initiation to a one-time `state` that lives ONLY in the
 * main process (never the renderer) and validate it on the callback.
 *
 * IN-MEMORY ONLY — deliberately not persisted. A `userData/*.json` store would
 * be writable by any local process, letting an attacker pre-seed a known state
 * and defeat the binding. The cost is that an OAuth flow started and then fully
 * quit mid-way loses its pending state (rare); the callback is then dropped and
 * the user is told to retry. The common case (app still running) is unaffected.
 */
const TTL_MS = 5 * 60 * 1000;

// nonce -> createdAt(ms). Multiple outstanding logins are allowed.
const pending = new Map<string, number>();

function gc(): void {
  const now = Date.now();
  for (const [k, t] of pending) {
    if (now - t > TTL_MS) pending.delete(k);
  }
}

/** Issue a fresh single-use state nonce and remember it. */
export function issueState(): string {
  gc();
  const state = randomUUID();
  pending.set(state, Date.now());
  return state;
}

/**
 * Validate + consume a candidate state. Single-use + TTL. ONLY the matching
 * entry is removed; an unknown candidate (foreign/phished) is rejected WITHOUT
 * clearing anyone else's pending login (otherwise a local attacker could grief
 * a real login by sending garbage).
 */
export function consumeState(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  gc();
  const createdAt = pending.get(candidate);
  if (createdAt === undefined) return false;
  pending.delete(candidate);
  return Date.now() - createdAt <= TTL_MS;
}

/** Test/teardown helper. */
export function _resetAuthState(): void {
  pending.clear();
}
