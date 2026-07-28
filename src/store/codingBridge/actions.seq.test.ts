// @vitest-environment jsdom
//
// `seq` is assigned by the relay from an IN-MEMORY log, but the browser
// persists its cursor across reloads. When the relay restarts, the session's
// seq space begins again at 1 while the stored cursor still holds the old
// high-water mark — every live event then looks like one already applied and
// the conversation goes silent for good.
import { describe, expect, it, vi } from 'vitest';
import createState from './state';
import mutations from './mutations';
import type { ICodingBridgeState } from './models';

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
    resume(): void {}
  }
}));

const { applyNodeEvent } = await import('./actions');

const NODE = 'node-1';
const SESSION = 'sess-1';

const harness = () => {
  const state: ICodingBridgeState = createState();
  const dispatched: string[] = [];
  const commit = (type: string, payload?: unknown): void => {
    const fn = (mutations as Record<string, (s: ICodingBridgeState, p: unknown) => void>)[type];
    if (!fn) {
      throw new Error(`unknown mutation: ${type}`);
    }
    fn(state, payload);
  };
  const dispatch = (type: string): void => {
    dispatched.push(type);
  };
  return {
    state,
    dispatched,
    // A (re)connect is what re-opens the window for detecting a renumbered space.
    reconnect: () => commit('clearSeqChecked'),
    text: (seq: number, text: string) =>
      applyNodeEvent(
        commit as never,
        dispatch as never,
        state,
        { event: 'session.text', session_id: SESSION, seq, text } as never,
        NODE
      )
  };
};

const texts = (state: ICodingBridgeState): (string | undefined)[] =>
  (state.events[SESSION] ?? []).map((event) => event.text);

describe('coding bridge seq cursor', () => {
  it('drops events already applied', () => {
    const h = harness();
    h.text(1, 'a');
    h.text(2, 'b');
    h.text(2, 'b again');
    expect(texts(h.state)).toEqual(['a', 'b']);
  });

  it('re-baselines when the relay restarts its seq space', () => {
    // Persisted cursor from before the restart.
    const h = harness();
    h.state.lastSeq[SESSION] = 200;
    h.text(1, 'after restart');
    h.text(2, 'still live');
    // Without the re-baseline both are silently discarded and the session looks
    // frozen until the user reloads the page.
    expect(texts(h.state)).toEqual(['after restart', 'still live']);
    expect(h.state.lastSeq[SESSION]).toBe(2);
  });

  it('re-baselines even when the first events of the new space were missed', () => {
    // The tab was backgrounded across the restart, so seq 1..5 went out while it
    // was disconnected. `resume` at cursor 200 finds nothing above 200 and the
    // relay emits no `stream_truncated` (its log exists and starts at 1), so the
    // only recovery signal is this first event — which a `seq === 1` test misses.
    const h = harness();
    h.state.lastSeq[SESSION] = 200;
    h.text(6, 'first one we see');
    h.text(7, 'and the next');
    expect(texts(h.state)).toEqual(['first one we see', 'and the next']);
    expect(h.state.lastSeq[SESSION]).toBe(7);
    // seq 1..5 are unreachable by any resume, so the live stream alone leaves a
    // hole. The transcript resync is what actually fills it.
    expect(h.dispatched).toContain('resyncSession');
  });

  it('does not re-baseline on a mid-space replay overlap', () => {
    // Replay only sends seq > cursor, so after the space has been validated on
    // this connection any seq <= cursor is a genuine duplicate. Re-baselining
    // there would re-apply the whole retained buffer.
    const h = harness();
    h.text(1, 'a');
    h.text(2, 'b');
    h.text(3, 'c');
    h.text(2, 'duplicate');
    expect(texts(h.state)).toEqual(['a', 'b', 'c']);
    expect(h.state.lastSeq[SESSION]).toBe(3);
    // A duplicate must not trigger a transcript refetch on every replay overlap.
    expect(h.dispatched).not.toContain('resyncSession');
  });

  it('does not re-baseline when seq 1 is itself the duplicate', () => {
    const h = harness();
    h.text(1, 'a');
    h.text(1, 'a duplicate');
    expect(texts(h.state)).toEqual(['a']);
  });

  it('re-validates the space on every reconnect', () => {
    // A reconnect is the only moment a restarted relay can be detected, so the
    // per-connection validation has to be dropped there — otherwise the very
    // first session opened in a tab would be the only one that can recover.
    const h = harness();
    h.text(1, 'a');
    h.text(2, 'b');
    h.reconnect();
    // Post-restart space: seq 1 is below the cursor (2) but is the first event we
    // see on this connection, so it re-baselines instead of being dropped.
    h.text(1, 'after a restart mid-session');
    expect(texts(h.state)).toEqual(['a', 'b', 'after a restart mid-session']);
    expect(h.state.lastSeq[SESSION]).toBe(1);
  });
});
