import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';

export const BROWSER_TOOL_EXECUTION_STATES: readonly IBrowserToolExecutionState[] = [
  'choose_device',
  'device_offline',
  'awaiting_device',
  'awaiting_local_approval',
  'takeover_required',
  'executing',
  'completed',
  'denied',
  'expired',
  'cancel_too_late'
];

const TERMINAL_STATES = new Set<IBrowserToolExecutionState>(['completed', 'denied', 'expired', 'cancel_too_late']);
const ALLOWED_TRANSITIONS: Record<IBrowserToolExecutionState, ReadonlySet<IBrowserToolExecutionState>> = {
  choose_device: new Set([
    'device_offline',
    'awaiting_device',
    'awaiting_local_approval',
    'takeover_required',
    'executing',
    ...TERMINAL_STATES
  ]),
  device_offline: new Set([
    'awaiting_device',
    'awaiting_local_approval',
    'takeover_required',
    'executing',
    ...TERMINAL_STATES
  ]),
  awaiting_device: new Set(['awaiting_local_approval', 'takeover_required', 'executing', ...TERMINAL_STATES]),
  awaiting_local_approval: new Set(['takeover_required', 'executing', ...TERMINAL_STATES]),
  takeover_required: new Set(['executing', ...TERMINAL_STATES]),
  executing: new Set(TERMINAL_STATES),
  completed: new Set(),
  denied: new Set(),
  expired: new Set(),
  cancel_too_late: new Set()
};

export interface IBrowserToolExecutionUpdate {
  execution_state?: IBrowserToolExecutionState;
  execution_sequence?: number;
  origin?: unknown;
}

export function isBrowserToolExecutionState(value: unknown): value is IBrowserToolExecutionState {
  return typeof value === 'string' && BROWSER_TOOL_EXECUTION_STATES.includes(value as IBrowserToolExecutionState);
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
  current: Pick<IChatMessageContentItem, 'execution_state' | 'execution_sequence' | 'origin'>,
  update: IBrowserToolExecutionUpdate
): Pick<IChatMessageContentItem, 'execution_state' | 'execution_sequence' | 'origin'> {
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
  const sanitizedOrigin = sanitizeBrowserOrigin(update.origin);
  if (sanitizedOrigin) next.origin = sanitizedOrigin;
  return next;
}
