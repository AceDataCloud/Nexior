// @vitest-environment jsdom
//
// Integration tests for the session-identity flow: they drive the REAL reducer
// (`applyNodeEvent` + the actual mutations) with the exact node→browser event
// streams the daemon emits, asserting the store ends in the right state for each
// of the four restore bugs this change fixes.
import { describe, expect, it, vi } from 'vitest';
import createState from './state';
import mutations from './mutations';
import type { ICodingBridgeState } from './models';

// `actions.ts` pulls in the notification helper, which dynamically imports a
// Capacitor native module that isn't resolvable in the test env. None of these
// tests exercise the permission/notification path, so stub it out.
vi.mock('@/utils/codingBridgeNotify', () => ({
  notifyPermissionLocally: () => {},
  subscribeWebPush: async () => null,
  unsubscribeWebPush: async () => null,
  registerNativePush: async () => null,
  requestWebPermission: async () => 'granted'
}));

const { applyNodeEvent } = await import('./actions');

const NODE = 'node-1';

// A harness whose `commit` applies the real named mutation to real state, so the
// test exercises production reducer logic end to end. `dispatch` is recorded.
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
  const feed = (payload: Record<string, unknown>): void =>
    applyNodeEvent(commit as never, dispatch as never, state, payload, NODE);
  return { state, dispatched, feed };
};

describe('coding bridge session identity (integration)', () => {
  it('re-keys to the real id mid-turn while keeping running status and live stream', () => {
    const h = harness();
    // A brand-new session opens under a provisional id and starts streaming...
    h.feed({ event: 'session.started', session_id: 'prov', cwd: '/repo', model: 'opus' });
    h.feed({ event: 'session.text_delta', session_id: 'prov', id: 'st1', text: 'Hel' });
    // ...then the node announces the provider's real id.
    h.feed({ event: 'session.identified', session_id: 'prov', sdk_session_id: 'real-1' });

    // Bug #1/#4: one identity. The provisional entry is gone; everything moved.
    expect(h.state.sessions['prov']).toBeUndefined();
    expect(h.state.sessions['real-1'].session_id).toBe('real-1');
    expect(h.state.currentSessionId).toBeUndefined(); // started() doesn't select; sendPrompt does
    // Bug #2: still running → the Stop button stays.
    expect(h.state.sessions['real-1'].status).toBe('running');
    // Bug #3: the streaming bubble survived the rename and is still open.
    expect(h.state.events['real-1'][0].text).toBe('Hel');
    expect(h.state.events['real-1'][0].streaming).toBe(true);
  });

  it('reattaches to a live session on restore after a reload (Stop + typewriter kept)', () => {
    const h = harness();
    // After a reload the store is empty; requestSessions → sessions.snapshot tells
    // us this session is running on the node right now.
    h.feed({ event: 'sessions.snapshot', sessions: [{ session_id: 'real-1', status: 'running' }] });
    expect(h.state.sessions['real-1'].started).toBe(true);
    expect(h.state.sessions['real-1'].status).toBe('running');

    // Opening it from history must reattach, NOT overwrite to idle.
    h.feed({
      event: 'history.detail',
      session_id: 'real-1',
      provider: 'claude',
      events: [
        { kind: 'prompt', text: 'do the thing' },
        { kind: 'text', text: 'working...' }
      ]
    });
    // Bug #2/#3: running preserved → Stop button + thinking indicator stay.
    expect(h.state.sessions['real-1'].status).toBe('running');
    expect(h.state.sessions['real-1'].started).toBe(true);
    expect(h.state.sessions['real-1'].readonly).not.toBe(true);
    // The transcript fills the past; later live deltas (higher seq) append on top.
    expect(h.state.events['real-1'].map((e) => e.kind)).toEqual(['prompt', 'text']);
    expect(h.state.currentSessionId).toBe('real-1');
  });

  it('does not clobber a live transcript we are already watching', () => {
    const h = harness();
    h.feed({ event: 'session.started', session_id: 'real-2' });
    h.feed({ event: 'session.text_delta', session_id: 'real-2', id: 's', text: 'live output' });
    // A late history.detail for the same id must keep the in-flight transcript.
    h.feed({
      event: 'history.detail',
      session_id: 'real-2',
      provider: 'claude',
      events: [{ kind: 'prompt', text: 'stale' }]
    });
    expect(h.state.events['real-2'][0].text).toBe('live output');
  });

  it('restores a dead transcript as a resumable idle session', () => {
    const h = harness();
    h.feed({
      event: 'history.detail',
      session_id: 'old-session',
      provider: 'claude',
      events: [{ kind: 'prompt', text: 'past chat' }]
    });
    // No live session → idle, resumable (claude), selected for viewing.
    expect(h.state.sessions['old-session'].status).toBe('idle');
    expect(h.state.sessions['old-session'].started).toBe(false);
    expect(h.state.sessions['old-session'].readonly).toBe(false);
    expect(h.state.currentSessionId).toBe('old-session');
    expect(h.state.events['old-session']).toHaveLength(1);
  });

  it('restores a Codex history session as resumable (not read-only)', () => {
    // Codex resume works end-to-end now (`codex exec resume` with the sandbox as a
    // -c override), so a Codex transcript opens as a continuable idle session.
    const h = harness();
    h.feed({ event: 'history.detail', session_id: 'cx', provider: 'codex', events: [] });
    expect(h.state.sessions['cx'].readonly).toBe(false);
    expect(h.state.sessions['cx'].status).toBe('idle');
  });

  it('replaces a partial relay buffer with the full transcript on idle reattach (bug 3)', () => {
    const h = harness();
    // A session the node still tracks (started) but NOT currently streaming, with
    // only a short partial replay held in memory.
    h.state.sessions['s1'] = {
      session_id: 's1',
      node_id: NODE,
      provider: 'claude',
      started: true,
      status: 'idle'
    } as never;
    h.state.events['s1'] = [{ id: 'a', session_id: 's1', kind: 'text', ts: 1, text: 'partial tail' }] as never;
    h.feed({
      event: 'history.detail',
      session_id: 's1',
      provider: 'claude',
      events: [
        { kind: 'prompt', text: 'q1' },
        { kind: 'text', text: 'a1' },
        { kind: 'prompt', text: 'q2' }
      ]
    });
    // The full on-disk transcript wins over the shorter partial buffer.
    expect(h.state.events['s1'].map((e) => e.kind)).toEqual(['prompt', 'text', 'prompt']);
  });

  it('does NOT clobber an actively streaming turn with a longer history detail', () => {
    const h = harness();
    h.feed({ event: 'session.started', session_id: 's2' }); // status: running
    h.feed({ event: 'session.text_delta', session_id: 's2', id: 'd', text: 'streaming…' });
    // A late, longer history.detail must keep the in-flight stream (replacing it
    // would drop the open bubble and the replay would duplicate the tail).
    h.feed({
      event: 'history.detail',
      session_id: 's2',
      provider: 'claude',
      events: [
        { kind: 'prompt', text: 'old1' },
        { kind: 'text', text: 'old2' },
        { kind: 'text', text: 'old3' }
      ]
    });
    expect(h.state.events['s2'].length).toBe(1);
    expect(h.state.events['s2'][0].text).toBe('streaming…');
  });

  it('reattaches (not just views) the open conversation when history snapshot lands after a reload', () => {
    const h = harness();
    // historyRef survives a reload (it is persisted); currentSessionId does not.
    h.state.historyRef = { node_id: NODE, provider: 'claude', session_id: 'real-1' };
    h.feed({
      event: 'history.snapshot',
      sessions: [{ session_id: 'real-1', provider: 'claude', running: true }]
    });
    // Must fully reattach the open conversation, not just fetch its transcript —
    // this is what re-pulls a running session's live stream + pending prompt.
    const reattach = h.dispatched.find((d) => d.type === 'reattachSession');
    expect(reattach).toBeDefined();
    expect(reattach?.payload).toMatchObject({ node_id: NODE, session_id: 'real-1' });
    expect(h.dispatched.some((d) => d.type === 'getHistoryDetail')).toBe(false);
  });

  it('advances and dedupes the per-session seq cursor (the persisted resume point)', () => {
    const h = harness();
    h.feed({ event: 'session.started', session_id: 'real-1' });
    h.feed({ event: 'session.text_delta', session_id: 'real-1', id: 's', text: 'a', seq: 5 });
    expect(h.state.lastSeq['real-1']).toBe(5);
    // A replayed/overlapping event at or below the cursor is dropped (no dup text).
    h.feed({ event: 'session.text_delta', session_id: 'real-1', id: 's', text: 'DUP', seq: 5 });
    expect(h.state.events['real-1'][0].text).toBe('a');
    // A higher seq advances the cursor and is applied.
    h.feed({ event: 'session.text_delta', session_id: 'real-1', id: 's', text: 'b', seq: 6 });
    expect(h.state.lastSeq['real-1']).toBe(6);
    expect(h.state.events['real-1'][0].text).toBe('ab');
  });
});
