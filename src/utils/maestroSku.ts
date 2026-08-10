import {
  MAESTRO_DEFAULT_QUALITY,
  MAESTRO_MIN_DURATION,
  MAESTRO_SKU_POLICIES,
  type IMaestroSku
} from '@/constants/maestro';

const LEGACY_SKUS: Record<string, IMaestroSku> = {
  draft: 'lite',
  premium: 'pro'
};

export function normalizeMaestroSku(value?: string): IMaestroSku {
  const normalized = value?.trim().toLowerCase() || MAESTRO_DEFAULT_QUALITY;
  if (normalized in MAESTRO_SKU_POLICIES) return normalized as IMaestroSku;
  return LEGACY_SKUS[normalized] || MAESTRO_DEFAULT_QUALITY;
}

export function clampMaestroDuration(value: unknown, sku: IMaestroSku): number {
  const fallback = Math.min(30, MAESTRO_SKU_POLICIES[sku].maxDuration);
  const duration = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(MAESTRO_SKU_POLICIES[sku].maxDuration, Math.max(MAESTRO_MIN_DURATION, duration));
}

export function clampMaestroLanguages(langs: string[] | undefined, sku: IMaestroSku): string[] {
  return (langs?.length ? langs : ['zh-cn']).slice(0, MAESTRO_SKU_POLICIES[sku].maxLanguages);
}

export function isMaestroScenarioAvailable(scenario: string, sku: IMaestroSku): boolean {
  return MAESTRO_SKU_POLICIES[sku].scenarios.includes(scenario);
}

export function estimateMaestroCredits(
  duration: number,
  sku: IMaestroSku,
  scenario = 'auto',
  languageCount = 1
): number {
  const scenarioMultiplier = scenario === 'drama' ? 1.35 : scenario === 'avatar' ? 1.15 : 1;
  const languageSurcharge = Math.max(0, languageCount - 1) * 6;
  return Number((duration * MAESTRO_SKU_POLICIES[sku].rate * scenarioMultiplier + languageSurcharge).toFixed(2));
}
