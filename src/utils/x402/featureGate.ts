import { isFeatureEnabled, getStickyFeatureOverrides } from '@/utils/featureFlag';
import { x402NetworkFeature, x402NetworkFeatures } from './networks';

export function isX402NetworkEnabled(network: string): boolean {
  const flag = x402NetworkFeature(network);
  return !flag || isFeatureEnabled(flag);
}

export function filterX402Requirements<T extends { network?: unknown }>(requirements: T[]): T[] {
  return requirements.filter((item) => isX402NetworkEnabled(String(item.network || '')));
}

/** Expand `all` for the request evaluator while preserving explicit force-OFF. */
export function getX402FeatureHeaders(): Record<string, string> {
  const raw = getStickyFeatureOverrides();
  if (!raw) return {};
  const tokens = raw.split(',');
  const expanded = tokens.includes('all') ? [...x402NetworkFeatures(), ...tokens.filter((t) => t !== 'all')] : tokens;
  return { 'x-feature-overrides': expanded.join(',') };
}

export function assertX402NetworkEnabled(network: string): void {
  if (!isX402NetworkEnabled(network)) {
    throw {
      code: 'payment_requirements_unavailable',
      params: { network },
      stage: 'sign',
      retryable: true,
      charged: false
    };
  }
}
