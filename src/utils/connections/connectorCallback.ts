import type { ConnectorCallbackResult } from '../desktop';

const buffered = new Map<string, ConnectorCallbackResult>();
const waiters = new Map<string, (result: ConnectorCallbackResult) => void>();

export function publishConnectorCallback(result: ConnectorCallbackResult): void {
  if (result.flowKey) buffered.set(result.requestId, result);
  const waiter = waiters.get(result.requestId);
  if (waiter) {
    waiters.delete(result.requestId);
    waiter(result);
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('acedata:connector-callback'));
}

export function waitForConnectorCallback(requestId: string): Promise<ConnectorCallbackResult> {
  const existing = buffered.get(requestId);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => waiters.set(requestId, resolve));
}

export function cancelConnectorCallbackWait(requestId: string): void {
  waiters.delete(requestId);
}

export function peekConnectorCallback(flowKey: string): ConnectorCallbackResult | undefined {
  return [...buffered.values()].find((result) => result.flowKey === flowKey);
}

export function consumeConnectorCallback(flowKey: string): ConnectorCallbackResult | undefined {
  for (const [requestId, result] of buffered) {
    if (result.flowKey !== flowKey) continue;
    buffered.delete(requestId);
    return result;
  }
  return undefined;
}

export function clearConnectorCallbacks(): void {
  buffered.clear();
  waiters.clear();
}
