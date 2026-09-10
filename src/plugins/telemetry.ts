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
import { BASE_HOST_STUDIO } from '@/constants';
import type { ISite } from '@/models';
import { isAuthTransitionError } from '@/utils/requestAuth';

const PROJECT_ID = 'LlKeKIj1mDzkYrY6na';
const HOST_URL = 'https://rumt-zh.com';

const telemetry = createTelemetry({ projectId: PROJECT_ID, hostUrl: HOST_URL });

export const initTelemetry = telemetry.initTelemetry;
export const setUser = telemetry.setUser;
export const track = telemetry.track;
export const captureError = telemetry.captureError;
export const trackApiFailure = telemetry.trackApiFailure;
export const isInitialized = telemetry.isInitialized;

export type X402WalletRail = 'base' | 'solana';
export type X402WalletEntrypoint = 'scenario_status' | 'order_checkout';

const pendingGenerationServices = new Map<string, string>();

const normalizeTaskId = (value: unknown): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const taskId = String(value).trim();
  return taskId || undefined;
};

export function trackWalletConnected(rail: X402WalletRail, entrypoint: X402WalletEntrypoint): void {
  track('x402_wallet_connected', { provider: rail, id: entrypoint });
}

export function trackGenerationTerminal(taskIdValue: unknown, successful: boolean): void {
  const taskId = normalizeTaskId(taskIdValue);
  if (!taskId) return;
  const service = pendingGenerationServices.get(taskId);
  if (!service) return;
  pendingGenerationServices.delete(taskId);
  if (!successful) return;
  track('generation_terminal_success', { service, task_id: taskId });
}

export function isVerifiedSubsite(site: ISite | null | undefined, hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  const siteOrigin = site?.origin?.trim().toLowerCase().replace(/\.$/, '');
  return Boolean(
    site?.id && siteOrigin && host === siteOrigin && host !== BASE_HOST_STUDIO && host.endsWith(`.${BASE_HOST_STUDIO}`)
  );
}

export function trackVerifiedSubsiteLoaded(site: ISite | null | undefined, hostname: string): void {
  if (!isVerifiedSubsite(site, hostname)) return;
  track('subsite_loaded', { site_id: site!.id, site_origin: site!.origin });
}

/**
 * Preserve legacy `generation_success` acceptance telemetry while correlating
 * task IDs so the poller can emit proven terminal success separately.
 */
export function instrumentGeneration<T>(service: string, promise: Promise<T>): Promise<T> {
  track('generation_submit', { service });
  return promise.then(
    (data) => {
      const taskId = normalizeTaskId((data as any)?.data?.id ?? (data as any)?.data?.task_id ?? (data as any)?.id);
      if (taskId) pendingGenerationServices.set(taskId, service);
      track('generation_success', { service, task_id: taskId });
      return data;
    },
    (error) => {
      if (isAuthTransitionError(error)) throw error;
      const paymentError = error?.name === 'X402PaymentError' ? error?.paymentError : undefined;
      track(paymentError ? 'x402_payment_failed' : 'generation_failed', {
        service,
        trace_id: error?.response?.data?.trace_id ?? error?.response?.headers?.['x-request-id'],
        ...(paymentError
          ? { error: paymentError.code, stage: paymentError.stage, network: paymentError.params.network }
          : { error: error?.response?.data?.error?.message ?? String(error) })
      });
      throw error;
    }
  );
}
