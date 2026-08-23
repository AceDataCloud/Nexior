import { randomUUID } from 'node:crypto';

const TTL_MS = 10 * 60 * 1000;
const pending = new Map<string, { requestId: string; createdAt: number }>();

function gc(): void {
  const now = Date.now();
  for (const [state, entry] of pending) {
    if (now - entry.createdAt > TTL_MS) pending.delete(state);
  }
}

export function issueConnectorState(): { state: string; requestId: string } {
  gc();
  const state = randomUUID();
  const requestId = randomUUID();
  pending.set(state, { requestId, createdAt: Date.now() });
  return { state, requestId };
}

export function consumeConnectorState(state: string | null | undefined): string | null {
  if (!state) return null;
  gc();
  const entry = pending.get(state);
  if (!entry) return null;
  pending.delete(state);
  return Date.now() - entry.createdAt <= TTL_MS ? entry.requestId : null;
}

export function _resetConnectorState(): void {
  pending.clear();
}
