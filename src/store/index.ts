import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import root from './common';
import persistRoot from './common/persist';

// Per-app store modules (chat / midjourney / qrart / luma / pika / kling /
// veo / sora / pixverse / flux / hailuo / headshots / suno / producer /
// nanobanana / openaiimage / seedream / seedance / serp / wan) are
// registered lazily at navigation time — see `src/store/lazy.ts` and the
// router's `beforeEach` hook in `src/router/index.ts`. Only the root
// (common) module is part of the entry chunk; opening the ChatGPT page no
// longer loads Suno / Midjourney / Luma / Sora / etc. and their operators.

// The persist *paths* are tiny string arrays so we eager-import every
// `<module>/persist.ts` file via `import.meta.glob` — a few hundred bytes,
// far smaller than registering a full `vuex-persistedstate` plugin per
// module. The plugin then watches every listed path; entries belonging to a
// not-yet-registered module are simply absent from `state` and become live
// the moment the module is registered (state is seeded from localStorage by
// `ensureStoreModule` so persisted values survive reloads even when the
// module is registered for the first time later in the session).
const lazyPersistModules = import.meta.glob<{ default: string[] }>(['./*/persist.ts', '!./common/persist.ts'], {
  eager: true
});

const lazyPersistPaths: string[] = Object.values(lazyPersistModules).flatMap((m) => m.default);

// Quota-safe wrapper around localStorage. The `vuex` blob has, in the past,
// grown past the ~5 MB browser quota for power users (mostly from per-app
// `tasks` arrays — now removed from `paths`). When the next setItem still
// overflows for any reason, drop the legacy key and retry once; if it still
// fails, swallow silently so the user-facing flow isn't broken by
// `QuotaExceededError: Setting the value of 'vuex' exceeded the quota.`
const isQuotaError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number };
  return e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014;
};

const safeStorage: Storage = {
  get length() {
    return window.localStorage.length;
  },
  clear: () => window.localStorage.clear(),
  key: (index: number) => window.localStorage.key(index),
  getItem: (key: string) => window.localStorage.getItem(key),
  removeItem: (key: string) => window.localStorage.removeItem(key),
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      try {
        window.localStorage.removeItem(key);
        window.localStorage.setItem(key, value);
      } catch {
        // Give up; better to lose persistence than crash the app.
      }
    }
  }
};

const store = createStore({
  ...root,
  plugins: [
    createPersistedState({
      paths: [...persistRoot, ...lazyPersistPaths],
      storage: safeStorage
    })
  ]
});

export default store;
