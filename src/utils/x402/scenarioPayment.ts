import { reactive } from 'vue';
import { isFeatureEnabled } from '@/utils/featureFlag';
import { isWeb } from '@/utils/surface';
import { clearAllScenarioPaymentErrors } from '@/utils/x402/paymentErrorState';

export type ScenarioPaymentMode = 'credits' | 'wallet';

interface ScenarioPaymentState {
  readonly mode: ScenarioPaymentMode;
  readonly walletAvailable: boolean;
  quoteUsdc?: string;
  quoteLoading: boolean;
}

const PAYMENT_MODE_STORAGE_KEY = 'nexior:x402:payment-mode';
const X402_SCENARIOS = new Set([
  'nanobanana',
  'openaiimage',
  'flux',
  'qrart',
  'luma',
  'pika',
  'pixverse',
  'hailuo',
  'veo',
  'seedance',
  'sora',
  'wan',
  'omni',
  'grokvideo',
  'minimax',
  'maestro',
  'kling',
  'digitalhuman',
  'serp',
  'suno',
  'midjourney',
  'producer',
  'chat'
]);

function readPreferredMode(): ScenarioPaymentMode {
  if (typeof window === 'undefined') return 'credits';
  try {
    const mode = window.localStorage.getItem(PAYMENT_MODE_STORAGE_KEY);
    return mode === 'wallet' || mode === 'credits' ? mode : 'credits';
  } catch {
    return 'credits';
  }
}

function persistPreferredMode(mode: ScenarioPaymentMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PAYMENT_MODE_STORAGE_KEY, mode);
  } catch {
    // Private mode or restricted storage: keep the in-memory preference.
  }
}

const preferredMode = reactive({ mode: readPreferredMode() });
const availability = reactive<Record<string, boolean | undefined>>({});
const states = reactive<Record<string, ScenarioPaymentState>>({});

export function isScenarioX402Enabled(): boolean {
  return isWeb() && isFeatureEnabled('x402');
}

export function isScenarioX402Supported(scenario: unknown): scenario is string {
  return typeof scenario === 'string' && X402_SCENARIOS.has(scenario);
}

export function scenarioPaymentState(scenario: string): ScenarioPaymentState {
  if (!states[scenario]) {
    states[scenario] = reactive({
      get walletAvailable(): boolean {
        return isScenarioX402Enabled() && isScenarioX402Supported(scenario) && availability[scenario] !== false;
      },
      get mode(): ScenarioPaymentMode {
        return this.walletAvailable && preferredMode.mode === 'wallet' ? 'wallet' : 'credits';
      },
      quoteLoading: false
    });
  }
  return states[scenario];
}

export function setPreferredPaymentMode(mode: ScenarioPaymentMode): void {
  preferredMode.mode = mode;
  persistPreferredMode(mode);
  if (mode === 'credits') {
    Object.values(states).forEach(clearScenarioQuote);
    clearAllScenarioPaymentErrors();
  }
}

export function setScenarioWalletAvailable(scenario: string, available: boolean): void {
  const state = scenarioPaymentState(scenario);
  availability[scenario] = available;
  if (!available) clearScenarioQuote(state);
}

function clearScenarioQuote(state: ScenarioPaymentState): void {
  state.quoteUsdc = undefined;
  state.quoteLoading = false;
}
