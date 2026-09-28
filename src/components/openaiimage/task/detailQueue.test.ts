import { describe, expect, it, vi } from 'vitest';
import { queueImageTaskDetail } from './detailQueue';

describe('image task detail queue', () => {
  it('serializes large reads and skips queued cards that left the viewport', async () => {
    const events: string[] = [];
    let release!: () => void;
    const first = new Promise<void>((resolve) => {
      release = resolve;
    });
    const skipped = new AbortController();
    const last = new AbortController();
    queueImageTaskDetail(async () => {
      events.push('first');
      await first;
    }, new AbortController().signal);
    queueImageTaskDetail(async () => {
      events.push('skipped');
    }, skipped.signal);
    queueImageTaskDetail(async () => {
      events.push('last');
    }, last.signal);
    expect(events).toEqual(['first']);
    skipped.abort();
    release();
    await vi.waitFor(() => expect(events).toEqual(['first', 'last']));
  });
});
