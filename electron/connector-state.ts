import { app, safeStorage } from 'electron';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const TTL_MS = 10 * 60 * 1000;
let fileOverride: string | undefined;
const FILE = (): string => fileOverride ?? path.join(app.getPath('userData'), 'connector-callback-state.json');

export interface ConnectorCallbackContext {
  requestId: string;
  connector: string;
  flowKey?: string;
}

interface StoredState {
  pending: Array<{ state: string; createdAt: number; context: ConnectorCallbackContext }>;
  consumed: Array<{ state: string; consumedAt: number }>;
}

const pending = new Map<string, { createdAt: number; context: ConnectorCallbackContext }>();
const consumed = new Map<string, number>();
let hydrated = false;

function unseal(raw: string): string {
  const stored = JSON.parse(raw) as { encrypted?: boolean; value?: string };
  if (!stored.value) return '';
  if (!stored.encrypted) return Buffer.from(stored.value, 'base64').toString('utf8');
  return safeStorage.decryptString(Buffer.from(stored.value, 'base64'));
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const data = JSON.parse(unseal(fs.readFileSync(FILE(), 'utf8'))) as StoredState;
    for (const entry of data.pending ?? [])
      pending.set(entry.state, { createdAt: entry.createdAt, context: entry.context });
    for (const entry of data.consumed ?? []) consumed.set(entry.state, entry.consumedAt);
  } catch {
    // First launch, expired/corrupt file, or unavailable keychain.
  }
}

function persist(): void {
  const data: StoredState = {
    pending: [...pending].map(([state, entry]) => ({ state, ...entry })),
    consumed: [...consumed].map(([state, consumedAt]) => ({ state, consumedAt }))
  };
  const plain = JSON.stringify(data);
  let encrypted = false;
  let value = Buffer.from(plain).toString('base64');
  try {
    if (safeStorage?.isEncryptionAvailable()) {
      encrypted = true;
      value = safeStorage.encryptString(plain).toString('base64');
    }
  } catch {
    // Linux without a keyring: keep the 0600 base64 fallback.
  }
  try {
    const target = FILE();
    const tmp = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ encrypted, value }), { mode: 0o600 });
    fs.renameSync(tmp, target);
  } catch {
    // In-memory state remains valid for this process; fail closed after restart.
  }
}

function gc(): void {
  hydrate();
  const now = Date.now();
  let changed = false;
  for (const [state, entry] of pending) {
    if (now - entry.createdAt > TTL_MS) {
      pending.delete(state);
      changed = true;
    }
  }
  for (const [state, consumedAt] of consumed) {
    if (now - consumedAt > TTL_MS) {
      consumed.delete(state);
      changed = true;
    }
  }
  if (changed) persist();
}

export function issueConnectorState(
  connector: string,
  flowKey?: string
): { state: string; context: ConnectorCallbackContext } {
  gc();
  const state = randomUUID();
  const context = { requestId: randomUUID(), connector, ...(flowKey ? { flowKey } : {}) };
  pending.set(state, { createdAt: Date.now(), context });
  persist();
  return { state, context };
}

export function consumeConnectorState(state: string | null | undefined): ConnectorCallbackContext | null {
  if (!state) return null;
  gc();
  const entry = pending.get(state);
  if (!entry) return null;
  pending.delete(state);
  if (Date.now() - entry.createdAt > TTL_MS) {
    persist();
    return null;
  }
  consumed.set(state, Date.now());
  persist();
  return entry.context;
}

export function isConsumedConnectorState(state: string | null | undefined): boolean {
  if (!state) return false;
  gc();
  return consumed.has(state);
}

export function _setConnectorStateFileForTests(file?: string): void {
  fileOverride = file;
  _resetConnectorStateCache();
}

export function _resetConnectorStateCache(): void {
  pending.clear();
  consumed.clear();
  hydrated = false;
}

export function _resetConnectorState(): void {
  pending.clear();
  consumed.clear();
  hydrated = true;
}
