import { api, UnauthorizedError, type LocalTaskSummary } from './api';
import { getDeviceId, getSiteOrigin, getToken, getLastSeenAt, setLastSeenAt } from './credentials';
import { missedTicks, nextTick } from './schedule';
import { executeRun } from './runner';

/**
 * The local scheduled-task daemon.
 *
 * Holds the schedules for tasks bound to this device and fires them from the
 * main process — NOT the renderer, whose timers Chromium throttles to roughly
 * once a minute when the window is hidden, which would make a "every 5 minutes"
 * task fire whenever the user happened to look at it.
 *
 * There is no cloud-side driver for these tasks and no heartbeat: if this
 * process is not running, nothing fires, by design. What the machine missed
 * while it was off is reported as skipped on the next start, never run late.
 */

const POLL_INTERVAL_MS = 60_000;
/** How far back a fresh start looks for missed ticks. Bounds the "I was off for
 *  a month" case to something a user would still recognize as relevant. */
const MAX_MISSED_LOOKBACK_SEC = 7 * 24 * 60 * 60;

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

interface Tracked {
  task: LocalTaskSummary;
  /** Next fire time, epoch seconds. null = never again (expired / bad cron). */
  nextAt: number | null;
}

export type DaemonState = 'stopped' | 'running' | 'signed_out';

export class SchedulerDaemon {
  private timer: NodeJS.Timeout | null = null;
  private tracked = new Map<string, Tracked>();
  private inFlight = new Set<string>();
  private state: DaemonState = 'stopped';
  private lastError: string | undefined;
  private onStateChange?: (state: DaemonState, error?: string) => void;

  constructor(private pollIntervalMs = POLL_INTERVAL_MS) {}

  setStateListener(cb: (state: DaemonState, error?: string) => void): void {
    this.onStateChange = cb;
  }

  getState(): { state: DaemonState; error?: string; taskCount: number } {
    return { state: this.state, error: this.lastError, taskCount: this.tracked.size };
  }

  /** Tasks and their next fire times, for the tray menu. */
  getSchedule(): { id: string; name: string; nextAt: number | null }[] {
    return [...this.tracked.values()].map((t) => ({ id: t.task.id, name: t.task.name, nextAt: t.nextAt }));
  }

  start(): void {
    if (this.timer) return;
    this.setState('running');
    // Poll once immediately so a just-created task doesn't wait a full minute
    // to be picked up.
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.setState('stopped');
  }

  private setState(state: DaemonState, error?: string): void {
    this.state = state;
    this.lastError = error;
    this.onStateChange?.(state, error);
  }

  private async tick(): Promise<void> {
    if (!getToken()) {
      // Signed out is a state, not an error: the tray says "sign in", and the
      // loop keeps running so signing back in resumes without a restart.
      this.setState('signed_out');
      this.tracked.clear();
      return;
    }

    try {
      await this.refreshTasks();
      this.setState('running');
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        this.setState('signed_out');
        this.tracked.clear();
        return;
      }
      // A failed refresh must not clear what we already know: a laptop on a
      // flaky connection should keep firing the schedule it last saw.
      this.setState('running', err instanceof Error ? err.message : String(err));
    }

    setLastSeenAt(nowSec());
    await this.fireDueTasks();
  }

  private async refreshTasks(): Promise<void> {
    const deviceId = getDeviceId();
    const siteOrigin = getSiteOrigin();
    const { items } = await api.listLocalTasks(deviceId, siteOrigin);

    const seen = new Set<string>();
    const now = nowSec();
    for (const task of items) {
      seen.add(task.id);
      const existing = this.tracked.get(task.id);
      // Recompute only when the task actually changed; otherwise keep the
      // pending tick so a poll can never push a due task past its own fire time.
      if (existing && existing.task.updated_at === task.updated_at) {
        existing.task = task;
        continue;
      }
      this.tracked.set(task.id, { task, nextAt: nextTick(task.schedule, now) });
    }
    for (const id of [...this.tracked.keys()]) {
      if (!seen.has(id)) this.tracked.delete(id);
    }
  }

  /**
   * Report ticks that passed while this process was not running.
   *
   * Called once at startup, before the first fire pass, so the run history
   * shows "didn't run" for the gap instead of an unexplained hole that reads
   * the same as "ran and said nothing".
   */
  async reportMissedSinceLastRun(): Promise<void> {
    const lastSeen = getLastSeenAt();
    if (!lastSeen) return; // first ever start — nothing to be missing
    const now = nowSec();
    const from = Math.max(lastSeen, now - MAX_MISSED_LOOKBACK_SEC);
    if (from >= now) return;

    const deviceId = getDeviceId();
    const siteOrigin = getSiteOrigin();
    for (const { task } of this.tracked.values()) {
      const missed = missedTicks(task.schedule, from, now);
      if (!missed.length) continue;
      try {
        await api.reportSkipped(task.id, deviceId, missed, siteOrigin);
      } catch {
        // Bookkeeping only — never let it stop the daemon from starting.
      }
    }
  }

  private async fireDueTasks(): Promise<void> {
    const now = nowSec();
    for (const entry of this.tracked.values()) {
      if (entry.nextAt === null || entry.nextAt > now) continue;
      const scheduledAt = entry.nextAt;
      // Advance BEFORE awaiting: a run that outlives the poll interval must not
      // be started twice by the next tick.
      entry.nextAt = nextTick(entry.task.schedule, scheduledAt);
      if (this.inFlight.has(entry.task.id)) continue;
      void this.runOne(entry.task, scheduledAt);
    }
  }

  /** Claim → execute → report. Public so "run now" from the tray reuses it. */
  async runOne(task: LocalTaskSummary, scheduledAt: number, manual = false): Promise<void> {
    if (this.inFlight.has(task.id)) return;
    this.inFlight.add(task.id);
    const deviceId = getDeviceId();
    const siteOrigin = getSiteOrigin();
    try {
      const claim = await api.claimRun(task.id, deviceId, scheduledAt, siteOrigin, manual);
      if (claim.already_running) return;

      const outcome = await executeRun(claim, { siteOrigin: claim.site_origin ?? siteOrigin, scheduledTaskId: task.id });
      await api.finishRun(
        {
          run_id: claim.run_id,
          device_id: deviceId,
          conversation_id: outcome.conversationId,
          terminal_reason: outcome.terminalReason,
          usage: outcome.usage,
          answer: outcome.answer,
          error_code: outcome.errorCode,
          trace_id: outcome.traceId
        },
        siteOrigin
      );
    } catch (err) {
      if (err instanceof UnauthorizedError) this.setState('signed_out');
      else console.warn(`[scheduler] task ${task.id} failed:`, err instanceof Error ? err.message : err);
    } finally {
      this.inFlight.delete(task.id);
    }
  }

  /** Does this device hold any local task? Drives whether the app stays
   *  resident after the last window closes. */
  hasTasks(): boolean {
    return this.tracked.size > 0;
  }

  /** Is this task one this device is responsible for? Lets the UI decide
   *  whether "run now" belongs here or in the cloud. */
  owns(taskId: string): boolean {
    return this.tracked.has(taskId);
  }

  /**
   * "Run now" for a task bound to this device.
   *
   * Must exist separately from the cloud's `trigger` action: that one runs the
   * agent loop through a server-side loopback, which has no client to execute
   * local tools on, so a local task fired that way reaches the model with none
   * of its authorized tools and can only answer that it cannot see the machine.
   *
   * Refreshes first so a task created moments ago — before the next poll — is
   * already known here.
   */
  async runNow(taskId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!getToken()) return { ok: false, reason: 'signed_out' };
    if (!this.tracked.has(taskId)) {
      try {
        await this.refreshTasks();
      } catch {
        return { ok: false, reason: 'refresh_failed' };
      }
    }
    const entry = this.tracked.get(taskId);
    if (!entry) return { ok: false, reason: 'not_on_this_device' };
    if (this.inFlight.has(taskId)) return { ok: false, reason: 'already_running' };
    void this.runOne(entry.task, nowSec(), true);
    return { ok: true };
  }
}

export const daemon = new SchedulerDaemon();
