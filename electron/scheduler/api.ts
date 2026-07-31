import { getToken } from './credentials';

/**
 * The daemon's HTTP client.
 *
 * Deliberately not the renderer's axios stack: this runs in the main process
 * with no window, so it cannot reach the Vuex store, the shared interceptors,
 * or `src/operators`. It speaks the same public API through Kong, with the same
 * Bearer token, and is billed the same way — which is exactly why no local
 * pre-authorization is needed here.
 */

const API_BASE = process.env.ACEDATA_API_BASE || 'https://api.acedata.cloud';
const SCHEDULED_TASKS_URL = `${API_BASE}/aichat2/scheduled-tasks`;
const CONVERSATIONS_URL = `${API_BASE}/aichat2/conversations`;

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function post<T>(url: string, body: unknown, siteOrigin?: string, timeoutMs = 30_000): Promise<T> {
  const token = getToken();
  if (!token) throw new UnauthorizedError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(siteOrigin ? { 'x-site-origin': siteOrigin } : {})
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    // A dead token must be distinguishable from a network blip: the tray says
    // "sign in again" for one and stays quiet for the other.
    if (res.status === 401 || res.status === 403) throw new UnauthorizedError();
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${text.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface LocalTaskSummary {
  id: string;
  name: string;
  schedule: import('./schedule').ScheduleSpec;
  jitter_seconds?: number;
  ends_at?: number;
  state: 'enabled' | 'disabled' | 'error';
  updated_at: number;
}

export interface ClaimedRun {
  run_id: string;
  question: string;
  model: string;
  max_turns?: number;
  memory_enabled?: boolean;
  skills?: string[];
  mcp_servers?: string[];
  unattended_policy?: { allowed_skills: string[]; allowed_mcp_servers?: string[]; allowed_local_tools?: string[] };
  site_origin?: string;
  title?: string;
  /** Present instead of the rest when this tick is already running elsewhere. */
  already_running?: boolean;
}

export const api = {
  listLocalTasks(deviceId: string, siteOrigin?: string): Promise<{ items: LocalTaskSummary[] }> {
    return post(SCHEDULED_TASKS_URL, { action: 'retrieve_local_batch', device_id: deviceId }, siteOrigin);
  },

  claimRun(
    taskId: string,
    deviceId: string,
    scheduledAt: number,
    siteOrigin?: string,
    manual = false
  ): Promise<ClaimedRun> {
    return post(
      SCHEDULED_TASKS_URL,
      { action: 'claim_local_run', task_id: taskId, device_id: deviceId, scheduled_at: scheduledAt, manual },
      siteOrigin
    );
  },

  finishRun(
    payload: {
      run_id: string;
      device_id: string;
      conversation_id?: string;
      terminal_reason?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      answer?: string;
      error_code?: string;
      trace_id?: string;
    },
    siteOrigin?: string
  ): Promise<{ status: string; outcome_reason?: string }> {
    return post(SCHEDULED_TASKS_URL, { action: 'finish_local_run', ...payload }, siteOrigin);
  },

  reportSkipped(
    taskId: string,
    deviceId: string,
    missedAt: number[],
    siteOrigin?: string
  ): Promise<{ recorded: number }> {
    return post(
      SCHEDULED_TASKS_URL,
      { action: 'report_local_skipped', task_id: taskId, device_id: deviceId, missed_at: missedAt },
      siteOrigin
    );
  },

  /**
   * One turn of the agent loop.
   *
   * Non-streaming: the daemon has no UI to stream into, and it only needs the
   * turn's terminal state to decide whether to run tools and resume. A run that
   * calls three local tools is three of these calls.
   *
   * The 15-minute timeout matches the cloud path's loopback budget.
   */
  chat(body: Record<string, unknown>, siteOrigin?: string): Promise<ChatTurnResponse> {
    return post(CONVERSATIONS_URL, body, siteOrigin, 15 * 60 * 1000);
  }
};

export interface ChatTurnResponse {
  id?: string;
  conversation_id?: string;
  answer?: string;
  terminal_reason?: string;
  trace_id?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  /** Client-executed tool calls this turn paused on. Absent when it did not
   *  pause. A streaming caller would learn these from `tool_use_start` events;
   *  the daemon has no event channel, so the worker reports them here. */
  pending_client_tools?: { tool_use_id: string; name: string; input: unknown }[];
}
