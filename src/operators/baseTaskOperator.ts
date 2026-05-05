import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API } from '@/constants';

/**
 * Filter shape accepted by every `*Operator.tasks(filter)` call.
 *
 * Concrete operators may extend this with service-specific keys
 * (e.g. Seedance / Suno add `type`). Unknown keys with `undefined`
 * value are simply omitted from the request body.
 */
export interface ITaskListFilter {
  ids?: string[];
  applicationId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  createdAtMax?: number;
  createdAtMin?: number;
  /**
   * Service-specific filter keys may be passed via this index.
   * Camel-case keys are auto-converted to snake_case in the request body.
   */
  [key: string]: unknown;
}

/** Constant request headers shared by every per-service task operator. */
const COMMON_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json'
};

/** Headers specific to retrieve / retrieve_batch endpoints. */
const TASK_HEADERS = {
  ...COMMON_HEADERS,
  'x-record-exempt': 'true'
};

/** Headers specific to generate endpoints. */
const GENERATE_HEADERS = {
  authorization: '',
  'content-type': 'application/json',
  accept: 'application/x-ndjson'
};

const camelToSnake = (s: string): string => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/**
 * Convert a camelCase filter object into a snake_case request body,
 * dropping `undefined`, `null`, and empty-string values. The hand-rolled
 * operators this replaces used a `filter.x ? { x } : {}` truthy check
 * for string/array fields (which dropped `''`/`null`/`undefined` but
 * KEPT `[]` since `Boolean([]) === true`) and a `!== undefined` check
 * for numeric fields (which preserved `0`). Dropping `undefined`,
 * `null`, and `''` reproduces both behaviors exactly: empty arrays are
 * still sent, every numeric `0` is preserved, and string/array nullish
 * values are still dropped.
 */
const toRequestBody = (filter: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null || v === '') continue;
    out[camelToSnake(k)] = v;
  }
  return out;
};

/**
 * Generic base for every per-service task operator (luma / seedance / sora /
 * veo / kling / hailuo / wan / flux / nanobanana / pika / pixverse / etc.).
 *
 * Each subclass picks the concrete response/request types and provides the
 * upstream paths via the constructor:
 *
 * ```ts
 * class LumaOperator extends BaseTaskOperator<
 *   ILumaGenerateRequest,
 *   ILumaGenerateResponse,
 *   ILumaTaskResponse,
 *   ILumaTasksResponse
 * > {
 *   constructor() {
 *     super({ tasksPath: '/luma/tasks', generatePath: '/luma/videos' });
 *   }
 * }
 * ```
 *
 * Behavior of `task()`, `tasks()`, and `generate()` is byte-identical to the
 * hand-rolled per-service implementations they replace — including request
 * headers, body shape, and `BASE_URL_API` routing.
 */
export class BaseTaskOperator<
  TGenerateRequest,
  TGenerateResponse,
  TTaskResponse,
  TTasksResponse,
  TFilter extends ITaskListFilter = ITaskListFilter
> {
  protected readonly tasksPath: string;
  protected readonly generatePath: string;

  constructor(paths: { tasksPath: string; generatePath: string }) {
    this.tasksPath = paths.tasksPath;
    this.generatePath = paths.generatePath;
  }

  async task(id: string, options: { token: string }): Promise<AxiosResponse<TTaskResponse>> {
    return axios.post(
      this.tasksPath,
      { action: 'retrieve', id },
      {
        baseURL: BASE_URL_API,
        headers: { ...TASK_HEADERS, authorization: `Bearer ${options.token}` }
      }
    );
  }

  async tasks(filter: TFilter, options: { token: string }): Promise<AxiosResponse<TTasksResponse>> {
    return axios.post(
      this.tasksPath,
      { action: 'retrieve_batch', ...toRequestBody(filter as Record<string, unknown>) },
      {
        baseURL: BASE_URL_API,
        headers: { ...TASK_HEADERS, authorization: `Bearer ${options.token}` }
      }
    );
  }

  async generate(data: TGenerateRequest, options: { token: string }): Promise<AxiosResponse<TGenerateResponse>> {
    return axios.post(this.generatePath, data, {
      baseURL: BASE_URL_API,
      headers: { ...GENERATE_HEADERS, authorization: `Bearer ${options.token}` }
    });
  }
}
