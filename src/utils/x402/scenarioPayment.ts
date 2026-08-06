import { ref } from 'vue';
import { isFeatureEnabled } from '@/utils/featureFlag';
import { isWeb } from '@/utils/surface';

export type ScenarioPaymentMode = 'credits' | 'wallet';

export const scenarioPaymentMode = ref<ScenarioPaymentMode>('credits');

export function isScenarioX402Enabled(): boolean {
  return isWeb() && isFeatureEnabled('x402');
}

export function resetScenarioPaymentMode(): void {
  scenarioPaymentMode.value = 'credits';
}
