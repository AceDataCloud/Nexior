import { reactive } from 'vue';
import { isFeatureEnabled } from '@/utils/featureFlag';
import { isWeb } from '@/utils/surface';

export type ScenarioPaymentMode = 'credits' | 'wallet';

interface ScenarioPaymentState {
  mode: ScenarioPaymentMode;
  quoteUsdc?: string;
  quoteLoading: boolean;
}

const states = reactive<Record<string, ScenarioPaymentState>>({});

export function isScenarioX402Enabled(): boolean {
  return isWeb() && isFeatureEnabled('x402');
}

export function scenarioPaymentState(scenario: string): ScenarioPaymentState {
  if (!states[scenario]) states[scenario] = { mode: 'credits', quoteLoading: false };
  return states[scenario];
}

export function setScenarioPaymentMode(scenario: string, mode: ScenarioPaymentMode): void {
  const state = scenarioPaymentState(scenario);
  state.mode = mode;
  if (mode === 'credits') {
    state.quoteUsdc = undefined;
    state.quoteLoading = false;
  }
}
