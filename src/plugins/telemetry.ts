/**
 * Frontend telemetry powered by Tencent Cloud RUM (Aegis). The Aegis glue now
 * lives in @acedatacloud/core (createTelemetry); this module wires it with
 * Nexior's RUM project id and keeps the existing exported function names plus
 * the Nexior-only `instrumentGeneration` helper.
 *
 * Project ID is hardcoded — Tencent RUM project ids are not secret (shipped to
 * every visitor anyway), and pinning it keeps local dev / Capacitor / preview
 * builds all reporting to the same dashboard.
 *   Console: https://console.cloud.tencent.com/rum
 *   App:     Ace Data Cloud (应用ID 154475, business system rum-vK9sZMBo)
 */
import { createTelemetry } from '@acedatacloud/core/telemetry';

const PROJECT_ID = 'LlKeKIj1mDzkYrY6na';
const HOST_URL = 'https://rumt-zh.com';

const telemetry = createTelemetry({ projectId: PROJECT_ID, hostUrl: HOST_URL });

export const initTelemetry = telemetry.initTelemetry;
export const setUser = telemetry.setUser;
export const track = telemetry.track;
export const captureError = telemetry.captureError;
export const trackApiFailure = telemetry.trackApiFailure;
export const isInitialized = telemetry.isInitialized;

/**
 * Wrap a generation request with `generation_submit` / `generation_success` /
 * `generation_failed` events. Preserves the underlying promise's value and
 * rejection so surrounding `.then` / `.catch` keep working unchanged.
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
