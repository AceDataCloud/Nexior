import axios from 'axios';
import { BASE_URL_API } from '@/constants';
import { currentSiteOrigin } from '@/utils';

function headers(token: string) {
  const origin = currentSiteOrigin();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(origin ? { 'x-site-origin': origin } : {})
  };
}

const BASE = `${BASE_URL_API}/aichat2/scheduled-tasks`;

// Without a timeout a stalled mobile connection leaves the promise pending
// forever, which would wedge the run-list poller's in-flight guard for the
// life of the page. Mirrors the 20s used by the shared client in common.ts.
const RUN_REQUEST_TIMEOUT_MS = 20_000;

export interface IScheduledTask {
  id: string;
  name: string;
  description?: string;
  state: 'enabled' | 'disabled' | 'error';
  /** Where runs fire from. Absent on tasks created before local mode — they
   *  are all cloud tasks, which is why this is optional rather than migrated. */
  execution?: IScheduledExecution;
  /** Which device fires a `local` task. Absent for cloud tasks. */
  device_id?: string;
  device_name?: string;
  /** Which client created the task. Display only — it never affects behaviour
   *  (that is `execution`'s job); a desktop-created task may well be cloud. */
  created_surface?: IScheduledSurface;
  schedule: IScheduleSpec;
  template_source?: {
    id: string;
    version: number;
    inputs: Record<string, string | number | boolean>;
    snapshot: {
      title: string;
      categories: string[];
    };
    customized?: boolean;
  };
  template_tested_at?: number;
  template: {
    model: string;
    question: string;
    skills?: string[];
    mcp_servers?: string[];
    max_turns?: number;
  };
  unattended_policy?: IScheduledTaskUnattendedPolicy;
  run_count: number;
  last_output_snippet?: string;
  last_error?: string;
  created_at: number;
  updated_at: number;
}

/** `cloud` = platform-scheduler fires it. `local` = the user's own desktop app
 *  does, which is what makes that machine's tools reachable. */
export type IScheduledExecution = 'cloud' | 'local';

export type IScheduledSurface = 'web' | 'desktop' | 'ios' | 'android';

export interface IScheduledRun {
  id: string;
  task_id: string;
  task_name?: string;
  status: IScheduledRunStatus;
  /** Where this run fired from, and on which machine if local. */
  execution?: IScheduledExecution;
  device_id?: string;
  device_name?: string;
  scheduled_at: number;
  llm_started_at?: number;
  llm_finished_at?: number;
  conversation_id?: string;
  conversation_title?: string;
  conversation_preview?: string;
  conversation_model_group?: string;
  error_code?: string;
  error_message?: string;
  /** Did the run achieve the user's goal? Judged from tool evidence, not from
   *  whether the agent loop merely terminated. Absent on pre-judge runs. */
  outcome?: 'achieved' | 'not_achieved' | 'unknown';
  /** One-line, user-facing explanation of `outcome`. */
  outcome_reason?: string;
  /** Which connector accounts this run actually used, snapshotted when it
   *  started. Absent on runs that used each connector's default account, and
   *  on runs predating the snapshot. */
  run_accounts?: IRunConnectionAccount[];
}

/** One connector account a run ran as. `label` / `account_name` are resolved at
 *  read time and are both absent once the account is deleted. */
export interface IRunConnectionAccount {
  connector_identifier: string;
  provider_alias?: string;
  label?: string;
  account_name?: string;
}

/** `indeterminate` = the outcome judge abstained. Terminal, but NOT a failure —
 *  the run may well have succeeded, we just could not prove it from tool
 *  evidence, so it must not render in the failure style.
 *
 *  `skipped` = a local task's tick passed while its device was off. Also
 *  terminal and also not a failure: the task is fine, the machine was asleep.
 *  Recorded so a gap in the history is distinguishable from a run that
 *  produced nothing. Never back-filled with a late run. */
export type IScheduledRunStatus = 'queued' | 'running' | 'success' | 'failed' | 'indeterminate' | 'skipped';

/** Give up on a pending run this long after it was scheduled. The worker's
 *  reaper force-fails abandoned runs 45 min in, sweeping every 5 min, so
 *  anything still pending past this is one the reaper can't reach — polling it
 *  would never end. Seconds, matching `scheduled_at`. */
export const RUN_PENDING_MAX_AGE_SECONDS = 55 * 60;

/** Is this run still expected to change on its own? A pending run has no
 *  `conversation_id` — the worker backfills it only once the agent loop
 *  returns — so the UI polls while any of these are on screen.
 *
 *  Every other status is terminal — `indeterminate` (the judge abstained) and
 *  `skipped` (the device was off) included. Neither will ever change on its
 *  own, so polling them would never end.
 *
 *  Anchored to the run's own age rather than to a wall-clock deadline held in
 *  the component, so leaving and returning to the page can't extend polling on
 *  a run that is never going to settle.
 *
 *  `nowMs` is required rather than defaulted: as a default it silently absorbs
 *  the index argument from `Array.some(isRunWorthPolling)`, which reads as
 *  correct and polls forever. */
export function isRunWorthPolling(run: IScheduledRun, nowMs: number): boolean {
  if (run.status !== 'queued' && run.status !== 'running') return false;
  return nowMs / 1000 - run.scheduled_at < RUN_PENDING_MAX_AGE_SECONDS;
}

export interface IScheduledRunFilter {
  status?: IScheduledRunStatus;
  offset?: number;
  limit?: number;
}

export type IScheduleSpec =
  | { type: 'cron'; cron: string; tz: string; ends_at?: number }
  | { type: 'interval'; interval_seconds: number; tz: string; ends_at?: number }
  | { type: 'once'; at: number; tz: string };

export interface IScheduledTaskUnattendedPolicy {
  /** Authorization IS these lists — empty means nothing is authorized. There is
   *  deliberately no `mode` flag: a second representation of the same fact is
   *  what silently blanked the edit dialog when the two drifted apart. */
  allowed_skills: string[];
  allowed_mcp_servers?: string[];
  /** Local (client-executed) tools this task may use — `fs.*`, `shell.*`,
   *  `computer.*`, `mcp.<server>.<tool>`. Same rule as the lists above: the
   *  list IS the authorization. Only meaningful for `execution: 'local'`;
   *  nobody is watching an unattended run, so an unlisted tool is never
   *  offered to the model rather than prompting a machine with no one at it. */
  allowed_local_tools?: string[];
  browser_connections?: IScheduledBrowserBinding[];
  /** Which account of each connector this task runs as. Omit to use the
   *  connector's default account (what interactive chat always does). */
  connection_bindings?: IScheduledConnectionBinding[];
  expires_at?: number;
}

export interface IScheduledConnectionBinding {
  connector_identifier: string;
  connection_id: string;
  /** Server-derived; never sent by the client (the backend re-derives it
   *  from the stored connection so a binding can't claim a provider it
   *  doesn't belong to). */
  provider_alias?: string;
}

/** One selectable account for a connector a skill needs. */
export interface IAuthorizableConnectionAccount {
  connection_id: string;
  connector_identifier: string;
  label: string;
  is_default: boolean;
  account_name: string;
  execution_type: string;
  supports_task_binding: boolean;
}

export interface IScheduledBrowserBinding {
  connection_id: string;
  /** Named to match the worker's `ScheduledBrowserBinding.connection_revision`
   *  — the old `revision` never matched and the field was dropped on save. */
  connection_revision: number;
  device_id: string;
  wire_contract_digest: string;
  policy_digest: string;
  /** The worker treats these as REQUIRED and rejects a binding whose values
   *  don't match the live skill authority. They stay optional here because
   *  the server does not yet surface them on `IAuthorizableBrowserConnection`,
   *  so the client has nothing to populate them from — the browser-binding
   *  path is inert until it does. Closing that gap is a prerequisite for
   *  shipping browser-backed scheduled tasks. */
  skill_id?: string;
  skill_revision?: string;
}

export interface IAuthorizableBrowserConnection extends IScheduledBrowserBinding {
  name: string;
  device_name: string;
  allowed_origins: string[];
  side_effects: Array<'publish' | 'comment'>;
  online: boolean;
  compatible: boolean;
}

export interface IAuthorizableSkill {
  slug: string;
  name: string;
  description: string;
  when_to_use?: string;
  required_connections: string[];
  allowed_tools: string[];
  source: string;
  connected: boolean;
  missing_connections: string[];
  browser_connections?: IAuthorizableBrowserConnection[];
  /** Candidate accounts per required connector, keyed by the same strings
   *  that appear in `required_connections`. Only present when the user has
   *  at least one connection for that connector. */
  connection_accounts?: Record<string, IAuthorizableConnectionAccount[]>;
}

export interface IAuthorizableMcpServer {
  slug: string;
  name: string;
  server_url: string;
}

export interface IAuthorizableCapabilities {
  skills: IAuthorizableSkill[];
  mcp_servers: IAuthorizableMcpServer[];
}

// Error code returned when an unattended-policy skill / MCP server is not bound
// (not active or missing a required connection) for the user.
export const SCHEDULED_TASK_ERROR_SKILL_NOT_ACTIVE = 'skill_not_active';
export const SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE = 'browser_authorization_stale';
export const SCHEDULED_TASK_ERROR_BROWSER_DEVICE_OFFLINE = 'browser_device_offline';

export function validateScheduledBrowserBinding(
  skill: IAuthorizableSkill | undefined,
  connectionId: string
): IAuthorizableBrowserConnection {
  if (!skill?.connected) throw new Error(SCHEDULED_TASK_ERROR_SKILL_NOT_ACTIVE);
  const connection = skill.browser_connections?.find((candidate) => candidate.connection_id === connectionId);
  if (!connection) throw new Error(SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE);
  if (!connection.online) throw new Error(SCHEDULED_TASK_ERROR_BROWSER_DEVICE_OFFLINE);
  if (!connection.compatible) throw new Error(SCHEDULED_TASK_ERROR_BROWSER_AUTHORIZATION_STALE);
  return connection;
}

export interface IScheduledTaskCapabilityDetail {
  kind: 'skill' | 'mcp_server';
  slug: string;
  reason: 'not_active' | 'missing_connections';
  missing_connections?: string[];
}

// Detect the backend `skill_not_active` rejection and return its structured
// detail, so the UI can prompt the user to bind the capability — or retry the
// save with `force` to store the policy anyway.
export function extractSkillNotActive(error: unknown): IScheduledTaskCapabilityDetail | null {
  const data = (error as { response?: { data?: { error?: string; detail?: IScheduledTaskCapabilityDetail } } })
    ?.response?.data;
  if (data?.error !== SCHEDULED_TASK_ERROR_SKILL_NOT_ACTIVE) return null;
  return data.detail ?? { kind: 'skill', slug: '', reason: 'not_active' };
}

export interface IScheduledTemplateFieldOption {
  value: string;
  label: string;
}

export interface IScheduledTemplateField {
  key: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'time';
  label: string;
  required: boolean;
  default?: string | boolean;
  options?: IScheduledTemplateFieldOption[];
}

export interface IScheduledTaskTemplateDefinition {
  id: string;
  version: number;
  title: string;
  summary: string;
  description: string;
  categories: string[];
  tags: string[];
  featured: boolean;
  form_schema: IScheduledTemplateField[];
  requirements: {
    skills: string[];
    mcp_servers: string[];
    connections: string[];
    local_tools: string[];
  };
  defaults: { model: string; schedule: IScheduleSpec; max_turns: number };
  test_strategy: { mode: 'preview_only' | 'controlled_delivery' };
  available: boolean;
  missing_connections: string[];
  connection_accounts?: Record<string, IAuthorizableConnectionAccount[]>;
}

export type ScheduledTaskPayload = {
  name: string;
  description?: string;
  schedule: IScheduleSpec;
  template: IScheduledTask['template'];
  unattended_policy?: IScheduledTaskUnattendedPolicy;
  /** Omit for a normal cloud task. `local` also requires `device_id`; the
   *  backend rejects the pair otherwise, since a local task nothing is bound
   *  to would never fire. */
  execution?: IScheduledExecution;
  device_id?: string;
  device_name?: string;
  /** Which client is creating this. Display/telemetry only. */
  created_surface?: IScheduledSurface;
};

class ScheduledTasksOperator {
  async listTasks(token: string): Promise<IScheduledTask[]> {
    const { data } = await axios.post(BASE, { action: 'retrieve_batch' }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async createTask(token: string, payload: ScheduledTaskPayload, force = false): Promise<IScheduledTask> {
    const { data } = await axios.post(
      BASE,
      { action: 'create', ...payload, ...(force ? { force: true } : {}) },
      { headers: headers(token) }
    );
    return data;
  }

  async updateTask(
    token: string,
    id: string,
    patch: Partial<
      Pick<IScheduledTask, 'name' | 'description' | 'state' | 'template' | 'schedule' | 'unattended_policy'>
    >,
    force = false
  ): Promise<IScheduledTask> {
    const { data } = await axios.post(
      BASE,
      { action: 'update', id, ...patch, ...(force ? { force: true } : {}) },
      { headers: headers(token) }
    );
    return data;
  }

  async deleteTask(token: string, id: string): Promise<void> {
    await axios.post(BASE, { action: 'delete', id }, { headers: headers(token) });
  }

  // Fire a task immediately, out of band from its schedule. Returns the id of
  // the freshly-spawned run so the caller can refresh the run history.
  async triggerTask(token: string, id: string): Promise<{ run_id?: string }> {
    const { data } = await axios.post(BASE, { action: 'trigger', id }, { headers: headers(token) });
    return data ?? {};
  }

  async listRuns(token: string, id: string): Promise<IScheduledRun[]> {
    const { data } = await axios.post(
      BASE,
      { action: 'retrieve_runs', id },
      { headers: headers(token), timeout: RUN_REQUEST_TIMEOUT_MS }
    );
    return data?.items ?? [];
  }

  // Every run the user owns, across all tasks, newest first.
  async listAllRuns(
    token: string,
    filter: IScheduledRunFilter = {}
  ): Promise<{ items: IScheduledRun[]; count: number }> {
    const { data } = await axios.post(
      BASE,
      { action: 'retrieve_runs_batch', ...filter },
      { headers: headers(token), timeout: RUN_REQUEST_TIMEOUT_MS }
    );
    return { items: data?.items ?? [], count: data?.count ?? 0 };
  }

  async listTemplates(
    token: string,
    filter: { category?: string; query?: string } = {}
  ): Promise<{ items: IScheduledTaskTemplateDefinition[]; categories: string[] }> {
    const { data } = await axios.post(
      BASE,
      { action: 'retrieve_template_batch', ...filter },
      { headers: headers(token) }
    );
    return { items: data?.items ?? [], categories: data?.categories ?? [] };
  }

  async previewTemplate(
    token: string,
    templateId: string,
    version: number,
    inputs: Record<string, string | number | boolean>
  ): Promise<{ question: string }> {
    const { data } = await axios.post(
      BASE,
      { action: 'preview_template', template_id: templateId, version, inputs },
      { headers: headers(token) }
    );
    return data;
  }

  async instantiateTemplate(
    token: string,
    payload: {
      template_id: string;
      version: number;
      name?: string;
      inputs: Record<string, string | number | boolean>;
      schedule?: IScheduleSpec;
      connection_bindings?: IScheduledConnectionBinding[];
    }
  ): Promise<IScheduledTask> {
    const { data } = await axios.post(
      BASE,
      { action: 'instantiate_template', ...payload },
      { headers: headers(token) }
    );
    return data;
  }

  async enableTemplateTask(token: string, id: string): Promise<IScheduledTask> {
    const { data } = await axios.post(BASE, { action: 'enable', id }, { headers: headers(token) });
    return data;
  }

  async listAuthorizableSkills(token: string): Promise<IAuthorizableSkill[]> {
    const { data } = await axios.post(BASE, { action: 'retrieve_authorizable_skills' }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async listAuthorizableCapabilities(token: string): Promise<IAuthorizableCapabilities> {
    const { data } = await axios.post(BASE, { action: 'retrieve_authorizable_skills' }, { headers: headers(token) });
    return {
      skills: data?.skills ?? data?.items ?? [],
      mcp_servers: data?.mcp_servers ?? []
    };
  }
}

export const scheduledTasksOperator = new ScheduledTasksOperator();
