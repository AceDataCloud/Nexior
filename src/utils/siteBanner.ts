import type { ISite, ISiteBannerI18nMap, ISiteMetadata } from '@/models';

interface INexiorMetadata {
  hidden_default_banner_ids?: string[];
  [key: string]: unknown;
}

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

export function getHiddenDefaultBannerIds(site?: ISite | null): Set<string> {
  const nexior = site?.metadata?.nexior;
  if (!nexior || typeof nexior !== 'object') return new Set();
  const ids = (nexior as INexiorMetadata).hidden_default_banner_ids;
  return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
}

export function withHiddenDefaultBannerIds(metadata: ISiteMetadata | undefined, ids: Iterable<string>): ISiteMetadata {
  const next = { ...(metadata || {}) };
  const current = next.nexior && typeof next.nexior === 'object' ? (next.nexior as INexiorMetadata) : {};
  const hiddenIds = [...new Set(ids)];
  const nexior: INexiorMetadata = { ...current };
  if (hiddenIds.length) nexior.hidden_default_banner_ids = hiddenIds;
  else delete nexior.hidden_default_banner_ids;
  if (Object.keys(nexior).length) next.nexior = nexior;
  else delete next.nexior;
  return next;
}
