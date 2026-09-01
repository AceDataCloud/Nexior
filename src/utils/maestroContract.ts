import { MAESTRO_MAX_DURATION, MAESTRO_MIN_DURATION } from '@/constants/maestro';

export const MAESTRO_MAX_LANGUAGES = 4;
export const MAESTRO_RATE_PER_SECOND = 0.6;

export function clampMaestroDuration(value: unknown): number {
  const duration = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 30;
  return Math.min(MAESTRO_MAX_DURATION, Math.max(MAESTRO_MIN_DURATION, duration));
}

export function clampMaestroLanguages(langs: string[] | undefined): string[] {
  return (langs?.length ? langs : ['zh-cn']).slice(0, MAESTRO_MAX_LANGUAGES);
}

export function estimateMaestroCredits(duration: number, scenario = 'auto', languageCount = 1): number {
  const scenarioMultiplier = scenario === 'drama' ? 1.35 : scenario === 'avatar' ? 1.15 : 1;
  const languageSurcharge = Math.max(0, languageCount - 1) * 6;
  return Number((duration * MAESTRO_RATE_PER_SECOND * scenarioMultiplier + languageSurcharge).toFixed(2));
}
