import { reactive } from 'vue';
import type { IApplication } from '@/models';
import store from '@/store';
import { ERROR_CODE_USED_UP } from '@/constants';
import { getEffectiveApplicationBalance } from './applicationQuota';
import {
  canPurchaseApplication,
  getApplicationPurchaseRoute,
  type ApplicationPurchaseRoute
} from './applicationPurchase';
import { isIOS } from './surface';
import { isScenarioX402Enabled, scenarioPaymentState } from './x402/scenarioPayment';

export type QuotaBalanceState = 'refreshing' | 'current' | 'unavailable';

interface QuotaExhaustedState {
  visible: boolean;
  applicationNamespace?: string;
  estimatedConsumption?: number;
  availableCredits?: number;
  balanceState: QuotaBalanceState;
  application?: IApplication;
  unit?: string;
  requestId: number;
}

export const quotaExhaustedState = reactive<QuotaExhaustedState>({
  visible: false,
  balanceState: 'unavailable',
  requestId: 0
});

function moduleState(namespace: string): any {
  return (store.state as any)[namespace];
}

async function refreshQuota(namespace: string, applicationId: string | undefined, requestId: number): Promise<void> {
  let globalApplications: unknown;
  let serviceApplications: unknown;
  try {
    [globalApplications, serviceApplications] = await Promise.all([
      store.dispatch('getApplications'),
      store.dispatch(`${namespace}/getApplications`)
    ]);
  } catch {
    if (requestId === quotaExhaustedState.requestId && quotaExhaustedState.visible) {
      quotaExhaustedState.balanceState = 'unavailable';
    }
    return;
  }
  if (requestId !== quotaExhaustedState.requestId || !quotaExhaustedState.visible) return;
  if (!Array.isArray(globalApplications) || !Array.isArray(serviceApplications) || !applicationId) {
    quotaExhaustedState.balanceState = 'unavailable';
    return;
  }
  const application = [...globalApplications, ...serviceApplications].find((item) => item.id === applicationId);
  if (!application) {
    quotaExhaustedState.balanceState = 'unavailable';
    return;
  }
  store.commit(`${namespace}/setApplication`, application);
  quotaExhaustedState.application = application;
  quotaExhaustedState.availableCredits = getEffectiveApplicationBalance(application, globalApplications);
  quotaExhaustedState.balanceState = 'current';
}

export function showQuotaExhausted(error: any, applicationNamespace: string, estimatedConsumption?: number): boolean {
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  if (code !== ERROR_CODE_USED_UP) return false;
  if (isScenarioX402Enabled() && scenarioPaymentState(applicationNamespace).mode === 'wallet') return false;

  const state = moduleState(applicationNamespace);
  const application = state?.application as IApplication | undefined;
  const requestId = quotaExhaustedState.requestId + 1;
  quotaExhaustedState.requestId = requestId;
  quotaExhaustedState.visible = true;
  quotaExhaustedState.applicationNamespace = applicationNamespace;
  quotaExhaustedState.estimatedConsumption = Number.isFinite(estimatedConsumption) ? estimatedConsumption : undefined;
  quotaExhaustedState.availableCredits = undefined;
  quotaExhaustedState.balanceState = 'refreshing';
  quotaExhaustedState.application = application;
  quotaExhaustedState.unit = state?.service?.unit;
  void refreshQuota(applicationNamespace, application?.id, requestId);
  return true;
}

export function closeQuotaExhausted(): void {
  quotaExhaustedState.requestId += 1;
  quotaExhaustedState.visible = false;
}

export function canTopUpQuota(): boolean {
  return canPurchaseApplication(quotaExhaustedState.application, store.getters.site, { ios: isIOS() });
}

export function getQuotaPurchaseRoute(): ApplicationPurchaseRoute | undefined {
  return canTopUpQuota() ? getApplicationPurchaseRoute(quotaExhaustedState.application) : undefined;
}
