import { MAESTRO_MAX_DURATION, MAESTRO_MIN_DURATION } from '@/constants/maestro';

export const MAESTRO_RATE_PER_SECOND = 0.7;

export function clampMaestroDuration(value: unknown): number {
  const duration = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 30;
  return Math.min(MAESTRO_MAX_DURATION, Math.max(MAESTRO_MIN_DURATION, duration));
}

export function estimateMaestroCredits(duration: number): number {
  return Number((clampMaestroDuration(duration) * MAESTRO_RATE_PER_SECOND).toFixed(2));
}
