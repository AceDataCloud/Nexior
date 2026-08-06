import cronParser from 'cron-parser';

/**
 * When a locally-executed scheduled task should next fire.
 *
 * Pure and dependency-free so the tick maths can be tested without a clock, a
 * window, or a network. Mirrors platform-scheduler's `computeNext` semantics
 * closely enough that a task behaves the same whichever side fires it — but
 * deliberately does NOT reimplement its jitter: a cloud scheduler jitters to
 * spread thousands of users' ticks across a fleet, while one desktop firing its
 * owner's handful of tasks has no herd to spread.
 */

export type ScheduleSpec =
  | { type: 'cron'; cron: string; tz?: string; starts_at?: number; ends_at?: number }
  | { type: 'interval'; interval_seconds: number; tz?: string; starts_at?: number; ends_at?: number }
  | { type: 'once'; at: number; tz?: string };

/** Seconds, matching the wire format (the backend speaks epoch seconds). */
export type Epoch = number;

/**
 * Parse one field of a 5-field cron expression into the set of values it
 * matches. Supports `*`, `a-b`, `*\/n`, `a-b/n` and comma-separated lists —
 * the subset the task form can produce. Returns null for anything else, which
 * the caller treats as "never fires" rather than guessing.
 */
function parseField(field: string, min: number, max: number): Set<number> | null {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart === undefined ? 1 : Number(stepPart);
    if (!Number.isInteger(step) || step < 1) return null;

    let lo: number;
    let hi: number;
    if (rangePart === '*') {
      lo = min;
      hi = max;
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-').map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      lo = a;
      hi = b;
    } else {
      const v = Number(rangePart);
      if (!Number.isInteger(v)) return null;
      lo = v;
      hi = v;
    }
    if (lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values.size ? values : null;
}

export function parseCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return (
    parseField(parts[0], 0, 59) !== null &&
    parseField(parts[1], 0, 23) !== null &&
    parseField(parts[2], 1, 31) !== null &&
    parseField(parts[3], 1, 12) !== null &&
    parseField(parts[4], 0, 7) !== null
  );
}

/**
 * The first tick strictly after `after`.
 *
 * Returns null when the schedule has no future tick (a `once` already past, an
 * expired `ends_at`, an unparseable or impossible cron). Callers treat null as
 * "this task is done", never as "fire now".
 *
 * Cron uses the task's saved IANA time zone, matching platform-scheduler. The
 * binding to a device controls where it fires, not what "9am" means.
 */
export function nextTick(schedule: ScheduleSpec, after: Epoch): Epoch | null {
  const endsAt = schedule.type === 'once' ? undefined : schedule.ends_at;
  if (endsAt !== undefined && after >= endsAt) return null;

  const tick = computeRawNext(schedule, after);
  if (tick === null) return null;
  if (endsAt !== undefined && tick > endsAt) return null;
  return tick;
}

function computeRawNext(schedule: ScheduleSpec, after: Epoch): Epoch | null {
  if (schedule.type === 'once') return schedule.at > after ? schedule.at : null;

  if (schedule.type === 'interval') {
    const period = Math.floor(schedule.interval_seconds);
    if (!Number.isFinite(period) || period < 1) return null;
    const anchor = schedule.starts_at ?? 0;
    if (anchor > after) return anchor;
    // Land on the anchor's grid rather than `after + period`, so a task that
    // misses ticks while the machine sleeps resumes on its original phase
    // instead of drifting a little later after every outage.
    const elapsed = after - anchor;
    return anchor + (Math.floor(elapsed / period) + 1) * period;
  }

  if (!parseCron(schedule.cron) || !schedule.tz) return null;
  const start = schedule.starts_at !== undefined && schedule.starts_at > after ? schedule.starts_at : after;
  try {
    const iter = cronParser.parseExpression(schedule.cron, {
      currentDate: new Date(start * 1000),
      tz: schedule.tz
    });
    return Math.floor(iter.next().toDate().getTime() / 1000);
  } catch {
    return null;
  }
}

/**
 * Every tick in (`from`, `until`], oldest first, capped at `limit`.
 *
 * Used on wake to find what was missed while the machine was off. These are
 * recorded as skipped, never run late: a 3am digest delivered at noon is worse
 * than none, and running a backlog all at once would bill the user for a burst
 * of work they did not ask for at that moment.
 */
export function missedTicks(schedule: ScheduleSpec, from: Epoch, until: Epoch, limit = 50): Epoch[] {
  const ticks: Epoch[] = [];
  let cursor = from;
  while (ticks.length < limit) {
    const tick = nextTick(schedule, cursor);
    if (tick === null || tick > until) break;
    ticks.push(tick);
    cursor = tick;
  }
  return ticks;
}
