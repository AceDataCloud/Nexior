import type { ISiteBannerI18nMap } from '@/models';

export function resolveSiteBannerText(map: ISiteBannerI18nMap | undefined, locale: string): string {
  if (!map || typeof map !== 'object') return '';
  const normalized = locale.replace('_', '-');
  const exact = Object.entries(map).find(([key]) => key.toLowerCase() === normalized.toLowerCase())?.[1];
  if (exact) return exact;
  const language = normalized.split('-', 1)[0].toLowerCase();
  const languageMatch = Object.entries(map).find(([key]) => key.split('-', 1)[0].toLowerCase() === language)?.[1];
  if (languageMatch) return languageMatch;
  const english = Object.entries(map).find(([key]) => key.toLowerCase() === 'en')?.[1];
  return english || Object.values(map).find((value) => typeof value === 'string' && value.trim()) || '';
}
