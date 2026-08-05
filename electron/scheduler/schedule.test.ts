import { describe, it, expect } from 'vitest';
import { nextTick, missedTicks, parseCron, type ScheduleSpec } from './schedule';

// Fixed UTC reference points, so tests do not depend on the host time zone.
const BASE = Math.floor(Date.UTC(2026, 2, 10, 8, 30, 0) / 1000);
const at = (y: number, mo: number, d: number, h: number, mi: number): number =>
  Math.floor(Date.UTC(y, mo, d, h, mi, 0) / 1000);

describe('parseCron', () => {
  it('accepts the shapes the task form produces', () => {
    expect(parseCron('0 9 * * *')).toBe(true);
    expect(parseCron('*/15 * * * *')).toBe(true);
    expect(parseCron('30 8 * * 1-5')).toBe(true);
    expect(parseCron('0 0,12 * * *')).toBe(true);
  });

  it('rejects malformed expressions rather than guessing', () => {
    // A misparsed cron that silently "works" would fire at the wrong time
    // forever; null makes the task visibly never fire instead.
    expect(parseCron('0 9 * *')).toBe(false);
    expect(parseCron('61 9 * * *')).toBe(false);
    expect(parseCron('0 25 * * *')).toBe(false);
    expect(parseCron('a b c d e')).toBe(false);
    expect(parseCron('*/0 * * * *')).toBe(false);
  });

  it('accepts cron day-of-week 7 as Sunday', () => {
    expect(parseCron('0 9 * * 7')).toBe(true);
  });
});

describe('nextTick — interval', () => {
  const every5min: ScheduleSpec = { type: 'interval', interval_seconds: 300, starts_at: BASE };

  it('fires one period after the anchor', () => {
    expect(nextTick(every5min, BASE)).toBe(BASE + 300);
  });

  it('stays on the anchor grid after a long outage instead of drifting', () => {
    // The point: a machine asleep for 3h07m resumes on the original phase.
    // `after + period` would shift every task a little later after every
    // outage until a "9:00 daily" task quietly became a 9:47 one.
    const after = BASE + 3 * 3600 + 7 * 60;
    const tick = nextTick(every5min, after)!;
    expect((tick - BASE) % 300).toBe(0);
    expect(tick).toBeGreaterThan(after);
    expect(tick - after).toBeLessThanOrEqual(300);
  });

  it('waits for a start date in the future', () => {
    const later: ScheduleSpec = { type: 'interval', interval_seconds: 300, starts_at: BASE + 86400 };
    expect(nextTick(later, BASE)).toBe(BASE + 86400);
  });

  it('returns null past ends_at', () => {
    const ending: ScheduleSpec = { type: 'interval', interval_seconds: 300, starts_at: BASE, ends_at: BASE + 600 };
    // The last tick on or before the end still fires...
    expect(nextTick(ending, BASE + 500)).toBe(BASE + 600);
    // ...but nothing beyond it, and nothing once the end has passed.
    expect(nextTick(ending, BASE + 600)).toBeNull();
    expect(nextTick(ending, BASE + 700)).toBeNull();
  });

  it('returns null for a nonsense period instead of a hot loop', () => {
    expect(nextTick({ type: 'interval', interval_seconds: 0 }, BASE)).toBeNull();
    expect(nextTick({ type: 'interval', interval_seconds: -60 }, BASE)).toBeNull();
  });
});

describe('nextTick — cron', () => {
  it('finds the next daily tick', () => {
    // 08:30 → today 09:00
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: '0 9 * * *' }, BASE)).toBe(at(2026, 2, 10, 9, 0));
  });

  it('rolls to tomorrow once today is past', () => {
    const afterNine = at(2026, 2, 10, 9, 30);
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: '0 9 * * *' }, afterNine)).toBe(at(2026, 2, 11, 9, 0));
  });

  it('honours weekday restrictions', () => {
    // 2026-03-10 is a Tuesday; a Fri-only task should land on the 13th.
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: '0 9 * * 5' }, BASE)).toBe(at(2026, 2, 13, 9, 0));
  });

  it('ORs the two day fields when both are restricted (POSIX rule)', () => {
    // "the 1st OR a Monday" — from Tue the 10th, next Monday is the 16th,
    // which is sooner than the 1st of April.
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: '0 9 1 * 1' }, BASE)).toBe(at(2026, 2, 16, 9, 0));
  });

  it('returns null for an unparseable cron instead of firing arbitrarily', () => {
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: 'not a cron' }, BASE)).toBeNull();
  });

  it('returns null for a date that never occurs', () => {
    expect(nextTick({ type: 'cron', tz: 'UTC', cron: '0 9 30 2 *' }, BASE)).toBeNull();
  });

  it('uses the task time zone rather than the device time zone', () => {
    const after = Math.floor(Date.parse('2026-03-10T00:30:00Z') / 1000);
    expect(nextTick({ type: 'cron', cron: '0 9 * * *', tz: 'Asia/Shanghai' }, after)).toBe(
      Math.floor(Date.parse('2026-03-10T01:00:00Z') / 1000)
    );
    expect(nextTick({ type: 'cron', cron: '0 9 * * *', tz: 'America/Los_Angeles' }, after)).toBe(
      Math.floor(Date.parse('2026-03-10T16:00:00Z') / 1000)
    );
  });

  it('advances through the spring DST gap using the IANA rule', () => {
    const after = Math.floor(Date.parse('2026-03-08T09:00:00Z') / 1000);
    expect(nextTick({ type: 'cron', cron: '30 2 * * *', tz: 'America/Los_Angeles' }, after)).toBe(
      Math.floor(Date.parse('2026-03-08T10:30:00Z') / 1000)
    );
  });

  it('does not fire the repeated fall-back wall-clock minute twice', () => {
    const beforeFirst = Math.floor(Date.parse('2026-11-01T08:00:00Z') / 1000);
    const first = nextTick({ type: 'cron', cron: '30 1 * * *', tz: 'America/Los_Angeles' }, beforeFirst)!;
    expect(first).toBe(Math.floor(Date.parse('2026-11-01T08:30:00Z') / 1000));
    expect(nextTick({ type: 'cron', cron: '30 1 * * *', tz: 'America/Los_Angeles' }, first)).toBe(
      Math.floor(Date.parse('2026-11-02T09:30:00Z') / 1000)
    );
  });

  it('fails closed for a missing or invalid time zone', () => {
    expect(nextTick({ type: 'cron', cron: '0 9 * * *' }, BASE)).toBeNull();
    expect(nextTick({ type: 'cron', cron: '0 9 * * *', tz: 'Mars/Olympus_Mons' }, BASE)).toBeNull();
  });
});

describe('nextTick — once', () => {
  it('fires only while still in the future', () => {
    expect(nextTick({ type: 'once', at: BASE + 60 }, BASE)).toBe(BASE + 60);
    expect(nextTick({ type: 'once', at: BASE - 60 }, BASE)).toBeNull();
    expect(nextTick({ type: 'once', at: BASE }, BASE)).toBeNull();
  });
});

describe('missedTicks', () => {
  const daily: ScheduleSpec = { type: 'cron', cron: '0 9 * * *', tz: 'UTC' };

  it('lists every tick in the gap, oldest first', () => {
    const from = at(2026, 2, 10, 10, 0); // after the 10th's run
    const until = at(2026, 2, 13, 10, 0);
    expect(missedTicks(daily, from, until)).toEqual([
      at(2026, 2, 11, 9, 0),
      at(2026, 2, 12, 9, 0),
      at(2026, 2, 13, 9, 0)
    ]);
  });

  it('is empty when nothing was missed', () => {
    const from = at(2026, 2, 10, 10, 0);
    expect(missedTicks(daily, from, at(2026, 2, 10, 20, 0))).toEqual([]);
  });

  it('caps the batch so a long outage cannot write unbounded history', () => {
    const from = BASE;
    const until = BASE + 365 * 86400;
    expect(missedTicks(daily, from, until, 10)).toHaveLength(10);
  });

  it('terminates on a one-shot schedule instead of looping', () => {
    // A `once` inside the window IS a missed tick and gets reported...
    expect(missedTicks({ type: 'once', at: BASE - 100 }, BASE - 200, BASE)).toEqual([BASE - 100]);
    // ...but one already past the window start yields nothing, and the loop
    // exits rather than spinning on a schedule with no next tick.
    expect(missedTicks({ type: 'once', at: BASE - 300 }, BASE - 200, BASE)).toEqual([]);
  });
});
