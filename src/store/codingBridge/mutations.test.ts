// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import createState from './state';
import {
  appendDelta,
  appendEvent,
  finalizeAllStreams,
  finalizeStream,
  renameSession,
  rewindToCut,
  setLastSeq,
  truncateEventsBefore,
  upsertSession
} from './mutations';
import type { ICodingBridgeEvent, ICodingBridgeSession } from '@/models';

const session = (overrides: Partial<ICodingBridgeSession> = {}): ICodingBridgeSession => ({
  session_id: 's1',
  node_id: 'n1',
  status: 'running',
  ...overrides
});

const textEvent = (overrides: Partial<ICodingBridgeEvent> = {}): ICodingBridgeEvent => ({
  id: 'e1',
  session_id: 's1',
  kind: 'text',
  ts: 0,
  ...overrides
});

describe('coding bridge streaming mutations', () => {
  it('appendDelta grows the open bubble matching the stream id', () => {
    const state = createState();
    appendEvent(state, textEvent({ text: 'He', stream_id: 'st1', streaming: true }));
    appendDelta(state, { session_id: 's1', stream_id: 'st1', text: 'llo' });
    expect(state.events['s1'][0].text).toBe('Hello');
    expect(state.events['s1'][0].streaming).toBe(true);
  });

  it('appendDelta is a no-op when no bubble matches the stream id', () => {
    const state = createState();
    appendEvent(state, textEvent({ text: 'He', stream_id: 'st1', streaming: true }));
    appendDelta(state, { session_id: 's1', stream_id: 'other', text: 'llo' });
    expect(state.events['s1'][0].text).toBe('He');
  });

  it('appendDelta ignores unknown sessions', () => {
    const state = createState();
    expect(() => appendDelta(state, { session_id: 'missing', stream_id: 'st1', text: 'x' })).not.toThrow();
    expect(state.events['missing']).toBeUndefined();
  });

  it('finalizeStream replaces text and clears the streaming flag', () => {
    const state = createState();
    appendEvent(state, textEvent({ text: 'Partial', stream_id: 'st1', streaming: true }));
    finalizeStream(state, { session_id: 's1', stream_id: 'st1', text: 'Partial final' });
    expect(state.events['s1'][0].text).toBe('Partial final');
    expect(state.events['s1'][0].streaming).toBe(false);
  });

  it('finalizeStream keeps existing text when none is provided', () => {
    const state = createState();
    appendEvent(state, textEvent({ text: 'Kept', stream_id: 'st1', streaming: true }));
    finalizeStream(state, { session_id: 's1', stream_id: 'st1' });
    expect(state.events['s1'][0].text).toBe('Kept');
    expect(state.events['s1'][0].streaming).toBe(false);
  });

  it('finalizeAllStreams closes every open bubble but leaves plain text alone', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a', text: 'one', stream_id: 'st1', streaming: true }));
    appendEvent(state, textEvent({ id: 'b', text: 'two', stream_id: 'st2', streaming: true }));
    appendEvent(state, textEvent({ id: 'c', text: 'plain' }));
    finalizeAllStreams(state, { session_id: 's1' });
    expect(state.events['s1'].map((item) => item.streaming)).toEqual([false, false, undefined]);
  });

  it('truncateEventsBefore drops the event and everything after it', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a' }));
    appendEvent(state, textEvent({ id: 'b', kind: 'prompt' }));
    appendEvent(state, textEvent({ id: 'c' }));
    truncateEventsBefore(state, { session_id: 's1', event_id: 'b' });
    expect(state.events['s1'].map((item) => item.id)).toEqual(['a']);
  });

  it('truncateEventsBefore is a no-op for an unknown event id', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a' }));
    truncateEventsBefore(state, { session_id: 's1', event_id: 'missing' });
    expect(state.events['s1'].map((item) => item.id)).toEqual(['a']);
  });
});

describe('coding bridge reliable-delivery mutations', () => {
  it('rewindToCut keeps the transcript up to and including the matching result', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a', kind: 'prompt' }));
    appendEvent(state, textEvent({ id: 'b', kind: 'result', cut_uuid: 'u1' }));
    appendEvent(state, textEvent({ id: 'c', kind: 'prompt' }));
    appendEvent(state, textEvent({ id: 'd', kind: 'text' }));
    rewindToCut(state, { session_id: 's1', cut_uuid: 'u1' });
    expect(state.events['s1'].map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('rewindToCut clears the whole transcript when there is no cut point', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a', kind: 'prompt' }));
    appendEvent(state, textEvent({ id: 'b', kind: 'text' }));
    rewindToCut(state, { session_id: 's1', cut_uuid: undefined });
    expect(state.events['s1']).toEqual([]);
  });

  it('rewindToCut is a no-op when the cut uuid is not found', () => {
    const state = createState();
    appendEvent(state, textEvent({ id: 'a', kind: 'result', cut_uuid: 'u1' }));
    rewindToCut(state, { session_id: 's1', cut_uuid: 'missing' });
    expect(state.events['s1'].map((item) => item.id)).toEqual(['a']);
  });

  it('setLastSeq advances the cursor monotonically and ignores stale seqs', () => {
    const state = createState();
    setLastSeq(state, { session_id: 's1', seq: 5 });
    expect(state.lastSeq['s1']).toBe(5);
    setLastSeq(state, { session_id: 's1', seq: 3 });
    expect(state.lastSeq['s1']).toBe(5);
    setLastSeq(state, { session_id: 's1', seq: 9 });
    expect(state.lastSeq['s1']).toBe(9);
  });
});

describe('coding bridge session identity (renameSession)', () => {
  it('migrates session, transcript, cursor, selection and history pointer', () => {
    const state = createState();
    upsertSession(state, session({ session_id: 'prov', status: 'running', started: true }));
    appendEvent(state, textEvent({ id: 'a', session_id: 'prov', text: 'hi' }));
    setLastSeq(state, { session_id: 'prov', seq: 7 });
    state.currentSessionId = 'prov';
    state.historyRef = { node_id: 'n1', provider: 'claude', session_id: 'prov' };

    renameSession(state, { from: 'prov', to: 'real' });

    expect(state.sessions['prov']).toBeUndefined();
    expect(state.sessions['real'].session_id).toBe('real');
    expect(state.sessions['real'].status).toBe('running');
    expect(state.events['prov']).toBeUndefined();
    expect(state.events['real'].map((e) => e.id)).toEqual(['a']);
    // The real id starts a FRESH relay seq space, so its cursor resets to 0 (not
    // the provisional id's 7) — otherwise the real id's first events get dropped.
    expect(state.lastSeq['real']).toBe(0);
    expect(state.lastSeq['prov']).toBeUndefined();
    expect(state.currentSessionId).toBe('real');
    expect(state.historyRef?.session_id).toBe('real');
  });

  it('keeps the live transcript when merging into a pre-existing snapshot stub', () => {
    const state = createState();
    // A snapshot stub already exists under the real id (no events yet)...
    upsertSession(state, session({ session_id: 'real', status: 'running', started: true }));
    // ...and the live, provisionally-keyed session holds the streamed transcript.
    upsertSession(state, session({ session_id: 'prov', model: 'opus' }));
    appendEvent(state, textEvent({ id: 'live', session_id: 'prov', text: 'streamed' }));

    renameSession(state, { from: 'prov', to: 'real' });

    expect(state.sessions['real'].model).toBe('opus');
    expect(state.events['real'].map((e) => e.id)).toEqual(['live']);
  });

  it('is a no-op when ids match or the source is missing', () => {
    const state = createState();
    upsertSession(state, session({ session_id: 's1' }));
    renameSession(state, { from: 's1', to: 's1' });
    renameSession(state, { from: 'ghost', to: 'x' });
    expect(Object.keys(state.sessions)).toEqual(['s1']);
  });
});
