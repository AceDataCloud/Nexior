const RELOAD_QUERY_PARAM = '__nexior_reload';
const RELOAD_STORAGE_PREFIX = 'nexior:chunk-load-reload';

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i
];

type VitePreloadErrorEvent = Event & {
  payload?: unknown;
};

let installed = false;

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isChunkLoadError(error: unknown): boolean {
  const text = getErrorText(error);
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function getCurrentEntrySignature(): string {
  const entryScript = Array.from(document.scripts).find((script) => {
    return script.type === 'module' && /\/assets\/index-[^/]+\.js(?:\?.*)?$/.test(script.src);
  });
  return entryScript?.src || window.location.origin;
}

function getReloadStorageKey(): string {
  return `${RELOAD_STORAGE_PREFIX}:${getCurrentEntrySignature()}`;
}

function hasReloadedCurrentEntry(): boolean {
  try {
    return window.sessionStorage.getItem(getReloadStorageKey()) === '1';
  } catch {
    return false;
  }
}

function markCurrentEntryReloaded(): void {
  try {
    window.sessionStorage.setItem(getReloadStorageKey(), '1');
  } catch {
    // Ignore blocked storage; the cache-busted URL still prevents stale HTML.
  }
}

function cleanupReloadQuery(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RELOAD_QUERY_PARAM)) {
    return;
  }
  url.searchParams.delete(RELOAD_QUERY_PARAM);
  window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function reloadWithCacheBuster(): void {
  const url = new URL(window.location.href);
  url.searchParams.set(RELOAD_QUERY_PARAM, Date.now().toString(36));
  window.location.replace(url.toString());
}

export function handleChunkLoadError(error: unknown): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !isChunkLoadError(error)) {
    return false;
  }

  if (hasReloadedCurrentEntry()) {
    console.error('Chunk load failed after a reload attempt.', error);
    return false;
  }

  markCurrentEntryReloaded();
  reloadWithCacheBuster();
  return true;
}

export function initializeChunkLoadErrorHandler(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || installed) {
    return;
  }

  installed = true;
  cleanupReloadQuery();

  window.addEventListener('vite:preloadError', (event) => {
    const preloadEvent = event as VitePreloadErrorEvent;
    if (handleChunkLoadError(preloadEvent.payload)) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (handleChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });
}
