export type HomeNavigationTarget = { kind: 'route'; to: string } | { kind: 'external'; href: string };

export const resolveHomeNavigation = (value?: string | null): HomeNavigationTarget | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || /[\\\s]/.test(normalized) || [...normalized].some((character) => character.charCodeAt(0) < 32)) {
    return null;
  }
  if (normalized.startsWith('/') && !normalized.startsWith('//')) return { kind: 'route', to: normalized };
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !parsed.hostname) return null;
    return { kind: 'external', href: parsed.href };
  } catch {
    return null;
  }
};
