import { isFeatureEnabled } from '@/utils/featureFlag';
import { x402NetworkFeature } from './networks';

export function isX402NetworkEnabled(network: string): boolean {
  const flag = x402NetworkFeature(network);
  return !flag || isFeatureEnabled(flag, true);
}

export function filterX402Requirements<T extends { network?: unknown }>(requirements: T[]): T[] {
  return requirements.filter((item) => isX402NetworkEnabled(String(item.network || '')));
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
