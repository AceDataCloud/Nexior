import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import { FACADE_CATALOG_DIGEST, WIRE_CONTRACT_DIGEST } from '@/generated/browserContract.generated';

export const BROWSER_TOOL_EXECUTION_STATES: readonly IBrowserToolExecutionState[] = [
  'starting_session',
  'attaching_tab',
  'ready',
  'executing',
  'completed',
  'device_offline',
  'device_busy',
  'authorization_required',
  'stopped',
  'expired',
  'debugger_unavailable',
  'unknown_outcome',
  'failed'
];

const TERMINAL_STATES = new Set<IBrowserToolExecutionState>([
  'completed',
  'stopped',
  'expired',
  'unknown_outcome',
  'failed'
]);
const ALLOWED_TRANSITIONS: Record<IBrowserToolExecutionState, ReadonlySet<IBrowserToolExecutionState>> = {
  starting_session: new Set(['attaching_tab', 'device_offline', 'device_busy', 'failed', 'stopped', 'expired']),
  attaching_tab: new Set(['ready', 'debugger_unavailable', 'device_offline', 'failed', 'stopped', 'expired']),
  ready: new Set(['executing', 'authorization_required', 'device_offline', 'device_busy', 'stopped', 'expired']),
  executing: new Set(TERMINAL_STATES),
  completed: new Set(),
  device_offline: new Set(['starting_session', 'stopped', 'expired', 'failed']),
  device_busy: new Set(['starting_session', 'stopped', 'expired', 'failed']),
  authorization_required: new Set(['executing', 'stopped', 'expired', 'failed']),
  stopped: new Set(),
  expired: new Set(),
  debugger_unavailable: new Set(['attaching_tab', 'stopped', 'expired', 'failed']),
  unknown_outcome: new Set(),
  failed: new Set()
};

export interface IBrowserToolExecutionUpdate {
  execution_state?: IBrowserToolExecutionState;
  execution_sequence?: number;
  browser_session_id?: string;
  browser_call_id?: string;
  wire_contract_digest?: string;
  facade_catalog_digest?: string;
  origin?: unknown;
}

export function isBrowserToolExecutionState(value: unknown): value is IBrowserToolExecutionState {
  return typeof value === 'string' && BROWSER_TOOL_EXECUTION_STATES.includes(value as IBrowserToolExecutionState);
}

export function shouldExecuteWithLocalExec(execution: IChatMessageContentItem['execution']): boolean {
  return execution === 'client';
}

export function isCompatibleBrowserContract(wireDigest: unknown, facadeDigest: unknown): boolean {
  return wireDigest === WIRE_CONTRACT_DIGEST && facadeDigest === FACADE_CATALOG_DIGEST;
}

export function sanitizeBrowserOrigin(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.origin === 'null' ? undefined : url.origin;
  } catch {
    return undefined;
  }
}

export function reduceBrowserToolExecution(
  current: Pick<
    IChatMessageContentItem,
    | 'execution_state'
    | 'execution_sequence'
    | 'browser_session_id'
    | 'browser_call_id'
    | 'wire_contract_digest'
    | 'facade_catalog_digest'
    | 'origin'
  >,
  update: IBrowserToolExecutionUpdate
): Pick<
  IChatMessageContentItem,
  | 'execution_state'
  | 'execution_sequence'
  | 'browser_session_id'
  | 'browser_call_id'
  | 'wire_contract_digest'
  | 'facade_catalog_digest'
  | 'origin'
> {
  const next = { ...current };
  const currentState = current.execution_state;
  const nextState = update.execution_state;
  const currentSequence = current.execution_sequence;
  const nextSequence = update.execution_sequence;
  if (currentState && TERMINAL_STATES.has(currentState)) return next;
  if (nextSequence !== undefined && currentSequence !== undefined && nextSequence <= currentSequence) return next;
  if (nextState && currentState && nextState !== currentState && !ALLOWED_TRANSITIONS[currentState].has(nextState)) {
    return next;
  }
  if (nextState) next.execution_state = nextState;
  if (nextSequence !== undefined) next.execution_sequence = nextSequence;
  if (update.browser_session_id) next.browser_session_id = update.browser_session_id;
  if (update.browser_call_id) next.browser_call_id = update.browser_call_id;
  if (update.wire_contract_digest) next.wire_contract_digest = update.wire_contract_digest;
  if (update.facade_catalog_digest) next.facade_catalog_digest = update.facade_catalog_digest;
  const sanitizedOrigin = sanitizeBrowserOrigin(update.origin);
  if (sanitizedOrigin) next.origin = sanitizedOrigin;
  return next;
}
