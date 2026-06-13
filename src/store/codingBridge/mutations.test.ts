// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import createState from './state';
import {
  appendDelta,
  appendEvent,
  finalizeAllStreams,
  finalizeStream,
  rewindToCut,
  setLastSeq,
  truncateEventsBefore
} from './mutations';
import type { ICodingBridgeEvent } from '@/models';

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
