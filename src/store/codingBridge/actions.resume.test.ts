// @vitest-environment jsdom
//
// Opening a conversation must NOT replay the relay's whole retained buffer.
// `resume` is pure catch-up on top of the live broadcast the relay already sends
// to every browser socket, so asking for it without a cursor made the relay
// stream up to 5000 buffered events oldest-first — the transcript then painted
// in from the beginning while the user waited for the newest message.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import createState from './state';
import mutations from './mutations';
import type { ICodingBridgeState } from './models';

const resumeCalls: Array<Record<string, number>> = [];

vi.mock('@/utils/codingBridgeNotify', () => ({
  notifyPermissionLocally: () => {},
  subscribeWebPush: async () => null,
  unsubscribeWebPush: async () => null,
  registerNativePush: async () => null,
  requestWebPermission: async () => 'granted'
}));

vi.mock('@/utils/codingBridgeSocket', () => ({
  CodingBridgeSocket: class {
    isOpen = true;
    connect(): void {}
    close(): void {}
    resume(cursors: Record<string, number>): void {
      resumeCalls.push(cursors);
    }
  }
}));

const { connect, reattachSession, applyNodeEvent } = await import('./actions');

const NODE = 'node-1';

// Harness over the real mutations, with the module-level socket singleton
// installed via the real `connect` action (that is the only way in).
const harness = () => {
  const state: ICodingBridgeState = createState();
  const dispatched: Array<{ type: string; payload: unknown }> = [];
  const commit = (type: string, payload?: unknown): void => {
    const fn = (mutations as Record<string, (s: ICodingBridgeState, p: unknown) => void>)[type];
    if (!fn) {
      throw new Error(`unknown mutation: ${type}`);
    }
    fn(state, payload);
  };
  const dispatch = (type: string, payload?: unknown): void => {
    dispatched.push({ type, payload });
  };
  const ctx = { state, commit, dispatch, rootState: { token: { access: 'tok' } } };
  connect(ctx as never);
  return {
    state,
    dispatched,
    closed: (session_id: string) =>
      applyNodeEvent(commit as never, dispatch as never, state, { event: 'session.closed', session_id } as never, NODE),
    open: (session_id: string) =>
      reattachSession(ctx as never, { node_id: NODE, provider: 'claude', session_id } as never)
  };
};

describe('coding bridge session resume cursor', () => {
  beforeEach(() => {
    resumeCalls.length = 0;
  });

  it('does not resume a session this tab has never followed', () => {
    const h = harness();
    h.open('never-seen');
    // No cursor → no replay. The transcript comes from history.detail and any
    // further output arrives on the relay's unconditional live broadcast.
    expect(resumeCalls).toEqual([]);
    // The conversation is still opened and its transcript still requested.
    expect(h.state.currentSessionId).toBe('never-seen');
    expect(h.dispatched.some((d) => d.type === 'getHistoryDetail')).toBe(true);
  });

  it('resumes from the stored cursor for a session it was already following', () => {
    const h = harness();
    h.state.lastSeq['seen'] = 42;
    h.open('seen');
    expect(resumeCalls).toEqual([{ seen: 42 }]);
  });

  it('does NOT resume for a session re-keyed mid-turn (no cursor = nothing to catch up)', () => {
    // `renameSession` leaves the real id with NO cursor: the relay numbers seq
    // per session_id, so the real id begins a FRESH space this tab has never
    // followed. Handing `reattachSession` a 0 instead would make it ask the
    // relay for everything from seq 0 — the very full-buffer replay this guard
    // exists to prevent.
    const h = harness();
    h.state.sessions['prov'] = { session_id: 'prov', node_id: NODE, status: 'running' } as never;
    h.state.lastSeq['prov'] = 7;
    (mutations as never as Record<string, (s: ICodingBridgeState, p: unknown) => void>).renameSession(h.state, {
      from: 'prov',
      to: 'real-1'
    });
    expect(h.state.lastSeq['real-1']).toBeUndefined();
    h.open('real-1');
    expect(resumeCalls).toEqual([]);
  });

  it('still resumes a closed session after a reconnect (close must not erase the cursor)', () => {
    // `session.closed` releases the relay-side log but the session can be written
    // to again. If the close had dropped our cursor, this reconnect would ask for
    // nothing and whatever arrived while we were away would be lost with no
    // truncation notice — a silent hole in the transcript.
    const h = harness();
    h.state.lastSeq['closed-then-written'] = 350;
    h.closed('closed-then-written');
    h.open('closed-then-written');
    expect(resumeCalls).toEqual([{ 'closed-then-written': 350 }]);
  });
});
