import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Credentials and device identity for the scheduled-task daemon.
 *
 * The daemon runs with no window, so it cannot read the renderer's
 * localStorage: the token has to live on disk. It is encrypted with
 * `safeStorage` (Keychain on macOS, DPAPI on Windows) where available, and the
 * file is 0600 either way — the mode is the floor, not the plan.
 *
 * Writes are atomic (tmp + rename) because a torn file here reads as "signed
 * out" and would silently stop every local task.
 */

interface StoredCredentials {
  /** Bearer token used for the three daemon calls AND the chat request. */
  token?: string;
  /** Set when `token` is base64 safeStorage ciphertext rather than plaintext. */
  encrypted?: boolean;
  /** Stable per-installation id. Tasks are bound to it. */
  device_id?: string;
  /** Human-facing name shown in the task list ("Qingcai 的 MacBook Pro"). */
  device_name?: string;
  /** Site the token belongs to; local runs must chat against the same origin. */
  site_origin?: string;
  /** Last time the daemon was alive, epoch seconds. Bounds the missed-tick
   *  sweep on wake so a fresh install doesn't report a year of skips. */
  last_seen_at?: number;
}

const FILE = (): string => path.join(app.getPath('userData'), 'scheduler-credentials.json');

let cache: StoredCredentials | null = null;

function read(): StoredCredentials {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(FILE(), 'utf8').replace(/^﻿/, '');
    cache = JSON.parse(raw) as StoredCredentials;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: StoredCredentials): void {
  cache = next;
  const target = FILE();
  const tmp = `${target}.${process.pid}.tmp`;
  // Atomic: a half-written credentials file reads as signed-out, which would
  // stop every local task without telling anyone why.
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, target);
}

/** Best-effort OS-keyed encryption. Falls back to plaintext-in-0600 on a box
 *  with no keyring (some Linux desktops), which is still better than refusing
 *  to run — the alternative is no local tasks at all. */
function seal(token: string): { token: string; encrypted: boolean } {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return { token: safeStorage.encryptString(token).toString('base64'), encrypted: true };
    }
  } catch {
    /* fall through to plaintext */
  }
  return { token, encrypted: false };
}

function unseal(stored: StoredCredentials): string | undefined {
  if (!stored.token) return undefined;
  if (!stored.encrypted) return stored.token;
  try {
    return safeStorage.decryptString(Buffer.from(stored.token, 'base64'));
  } catch {
    // Keychain entry gone (OS reinstall, profile copied to another machine).
    // Treat as signed out rather than throwing on every tick.
    return undefined;
  }
}

export function getToken(): string | undefined {
  return unseal(read());
}

export function getSiteOrigin(): string | undefined {
  return read().site_origin;
}

export function setCredentials(token: string, siteOrigin?: string): void {
  const current = read();
  write({ ...current, ...seal(token), ...(siteOrigin ? { site_origin: siteOrigin } : {}) });
}

/** Sign-out. Keeps `device_id` so re-signing in doesn't orphan tasks already
 *  bound to this machine. */
export function clearCredentials(): void {
  const { device_id, device_name } = read();
  write({ device_id, device_name });
}

/** Stable installation id, minted on first use. */
export function getDeviceId(): string {
  const current = read();
  if (current.device_id) return current.device_id;
  const deviceId = randomUUID();
  write({ ...current, device_id: deviceId });
  return deviceId;
}

export function getDeviceName(): string | undefined {
  return read().device_name;
}

export function setDeviceName(name: string): void {
  write({ ...read(), device_name: name.slice(0, 120) });
}

export function getLastSeenAt(): number | undefined {
  return read().last_seen_at;
}

export function setLastSeenAt(epoch: number): void {
  write({ ...read(), last_seen_at: epoch });
}

/** Test seam: drop the in-memory copy so the next read hits disk. */
export function resetCacheForTests(): void {
  cache = null;
}
