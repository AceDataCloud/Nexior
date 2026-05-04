/**
 * Frontend telemetry powered by Tencent Cloud RUM (Aegis).
 *
 * Captures:
 *   - JS errors / unhandled rejections / Vue render errors
 *   - API request speed + 4xx/5xx (Aegis built-in `reportApiSpeed`)
 *   - SPA page views (Aegis built-in `spa: true`)
 *   - Custom business events via `track(event, props)`
 *   - Manual error reporting via `captureError(err, ctx)`
 *
 * Project ID is hardcoded — Tencent RUM project IDs are not secret (they're
 * shipped to every visitor's browser anyway), and pinning the ID keeps local
 * dev / Capacitor / preview builds all reporting to the same dashboard so
 * pre-production issues are visible too.
 *
 * Console: https://console.cloud.tencent.com/rum
 */

import type Aegis from 'aegis-web-sdk';

type AegisInstance = InstanceType<typeof Aegis>;

interface InitOptions {
  uin?: string;
  fingerprint?: string;
  release?: string;
}

let aegis: AegisInstance | null = null;
let initialized = false;

// Aegis "report id" — the alphanumeric token shown on each Web app's "应用接入"
// row in the RUM console (NOT the numeric "应用ID" / "业务系统 ID").
// Pinned here intentionally: this value is shipped to every visitor anyway,
// so there's nothing to gain from sourcing it from env vars, and pinning
// keeps local dev / Capacitor / preview builds reporting to the same
// dashboard as production.
//   Console:  https://console.cloud.tencent.com/rum
//   App:      Ace Data Cloud (numeric 应用ID 154475, business system rum-vK9sZMBo)
const PROJECT_ID = 'LlKeKIj1mDzkYrY6na';
const HOST_URL = 'https://rumt-zh.com';

/**
 * Initialize Aegis. Safe to call multiple times — subsequent calls update
 * config (uin, aid) instead of reinstantiating.
 */
export async function initTelemetry(opts: InitOptions = {}): Promise<void> {
  if (initialized && aegis) {
    setUser(opts.uin, opts.fingerprint);
    return;
  }

  try {
    const { default: AegisCtor } = await import('aegis-web-sdk');
    aegis = new AegisCtor({
      id: PROJECT_ID,
      uin: opts.uin,
      aid: opts.fingerprint,
      reportApiSpeed: true,
      reportAssetSpeed: true,
      spa: true,
      hostUrl: HOST_URL,
      version: opts.release
    });
    initialized = true;
  } catch (err) {
    // SDK load failure must never break the app.
    console.warn('[telemetry] failed to init Aegis:', err);
  }
}

/**
 * Update the visitor identity (after login, after fingerprint resolves).
 */
export function setUser(uin?: string, aid?: string): void {
  if (!aegis) return;
  try {
    if (uin) aegis.setConfig({ uin });
    if (aid) aegis.setConfig({ aid });
  } catch (err) {
    console.warn('[telemetry] setUser failed:', err);
  }
}

/**
 * Fire a custom business event. Property values are coerced to strings and
 * placed into Aegis's `ext1..ext3` slots so they're filterable in the RUM
 * dashboard.
 *
 *   track('payment_success', { order_id, pay_way, amount })
 */
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!aegis) return;
  try {
    const ext1 = props.service ?? props.pay_way ?? props.action;
    const ext2 = props.order_id ?? props.task_id ?? props.id;
    const ext3 = props.trace_id ?? props.error;
    aegis.info({
      msg: event,
      ext1: ext1 != null ? String(ext1) : undefined,
      ext2: ext2 != null ? String(ext2) : undefined,
      ext3: ext3 != null ? String(ext3) : undefined
    });
  } catch (err) {
    console.warn('[telemetry] track failed:', err);
  }
}

/**
 * Capture an exception (Vue errorHandler, unhandled rejection, manual catch).
 */
export function captureError(error: unknown, ctx: Record<string, unknown> = {}): void {
  if (!aegis) return;
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    aegis.error({
      msg: err.message,
      stack: err.stack,
      ext1: ctx.source != null ? String(ctx.source) : undefined,
      ext2: ctx.route != null ? String(ctx.route) : undefined,
      ext3: ctx.trace_id != null ? String(ctx.trace_id) : undefined
    });
  } catch (e) {
    console.warn('[telemetry] captureError failed:', e);
  }
}

/**
 * Mark an API failure (called from axios response interceptor). Goes through
 * `info` rather than `error` so it doesn't double-count with Aegis's built-in
 * `reportApiSpeed` 4xx/5xx capture; the value of this hook is attaching the
 * server-side `trace_id` so the entry can be cross-referenced with CLS.
 */
export function trackApiFailure(args: { url: string; method?: string; status?: number; trace_id?: string }): void {
  if (!aegis) return;
  try {
    aegis.info({
      msg: 'api_failure',
      ext1: `${args.method ?? 'GET'} ${args.url}`,
      ext2: args.status != null ? String(args.status) : undefined,
      ext3: args.trace_id
    });
  } catch (err) {
    console.warn('[telemetry] trackApiFailure failed:', err);
  }
}

/** Returns true when the SDK is up and running. Useful for tests. */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Wrap a generation request with `generation_submit` / `generation_success`
 * / `generation_failed` events.
 *
 *   instrumentGeneration('flux', fluxOperator.generate(req, { token }))
 *     .then(...)
 *     .catch(...)
 *
 * The wrapper preserves the underlying promise's resolved value and rejection,
 * so the surrounding `.then` / `.catch` keep working unchanged.
 */
export function instrumentGeneration<T>(service: string, promise: Promise<T>): Promise<T> {
  track('generation_submit', { service });
  return promise.then(
    (data) => {
      const taskId = (data as any)?.data?.id ?? (data as any)?.data?.task_id ?? (data as any)?.id;
      track('generation_success', { service, task_id: taskId });
      return data;
    },
    (error) => {
      track('generation_failed', {
        service,
        trace_id: error?.response?.data?.trace_id ?? error?.response?.headers?.['x-request-id'],
        error: error?.response?.data?.error?.message ?? String(error)
      });
      throw error;
    }
  );
}
