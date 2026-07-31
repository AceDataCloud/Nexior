// @vitest-environment jsdom
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RUN_PENDING_MAX_AGE_SECONDS, isRunWorthPolling, scheduledTasksOperator } from './scheduledTasks';
import type { IScheduledRun } from './scheduledTasks';

describe('operators/scheduledTasks', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('run list requests', () => {
    // These two are the only requests the UI issues on a timer. A stalled
    // mobile connection would otherwise leave the promise pending forever and
    // wedge the poller's in-flight guard for the life of the page.
    it('bounds listAllRuns with a timeout', async () => {
      const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [], count: 0 } });
      await scheduledTasksOperator.listAllRuns('tok');
      expect(post.mock.calls[0][2]).toMatchObject({ timeout: expect.any(Number) });
    });

    it('bounds listRuns with a timeout', async () => {
      const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { items: [] } });
      await scheduledTasksOperator.listRuns('tok', 'task-1');
      expect(post.mock.calls[0][2]).toMatchObject({ timeout: expect.any(Number) });
    });
  });

  describe('isRunWorthPolling', () => {
    const at = (status: IScheduledRun['status'], scheduled_at = 0): IScheduledRun => ({
      id: 'r1',
      task_id: 't1',
      status,
      scheduled_at
    });
    const NOW = 60_000;

    it('polls runs that have yet to reach a terminal status', () => {
      expect(isRunWorthPolling(at('queued'), NOW)).toBe(true);
      expect(isRunWorthPolling(at('running'), NOW)).toBe(true);
    });

    it('leaves terminal runs alone', () => {
      expect(isRunWorthPolling(at('success'), NOW)).toBe(false);
      expect(isRunWorthPolling(at('failed'), NOW)).toBe(false);
    });

    // `indeterminate` is what the worker actually sends when the judge
    // abstains. The type used to say `needs_user_input`, which no backend
    // ever emits — a drift that made this test assert on a status that
    // could not occur.
    it('leaves indeterminate alone — terminal, and not a failure', () => {
      expect(isRunWorthPolling(at('indeterminate'), NOW)).toBe(false);
    });

    // A local task's tick that passed while the device was off. Terminal by
    // construction: nothing is going to run it later.
    it('leaves skipped alone', () => {
      expect(isRunWorthPolling(at('skipped'), NOW)).toBe(false);
    });

    it('gives up once a pending run outlives the reaper window', () => {
      const justInside = (RUN_PENDING_MAX_AGE_SECONDS - 1) * 1000;
      const justOutside = (RUN_PENDING_MAX_AGE_SECONDS + 1) * 1000;
      expect(isRunWorthPolling(at('running'), justInside)).toBe(true);
      expect(isRunWorthPolling(at('running'), justOutside)).toBe(false);
    });
  });
});
