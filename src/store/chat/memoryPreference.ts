export function getPersistedMemoryEnabled(fallback: boolean): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem('vuex');
    if (!raw) return fallback;
    const value = JSON.parse(raw)?.chat?.memoryEnabled;
    return typeof value === 'boolean' ? value : fallback;
  } catch {
    return fallback;
  }
}
