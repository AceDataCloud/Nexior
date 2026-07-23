import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import root from './common';
import persistRoot from './common/persist';
import { stripConversationMessages } from './chat/summarize';
import type { IChatConversation } from '@/models';

// Per-app store modules (chat / midjourney / qrart / luma / pika / kling /
// veo / sora / pixverse / flux / hailuo / suno / producer /
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

const persistPaths: string[] = [...persistRoot, ...lazyPersistPaths];

// Minimal get/set over dot-paths (all persisted paths are simple dot-paths —
// no array indices), mirroring vuex-persistedstate's default reducer.
const getPath = (obj: any, path: string): any => path.split('.').reduce((acc, key) => acc?.[key], obj);
const setPath = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  let cursor = obj;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = cursor[key] ?? {};
      cursor = cursor[key];
    }
  });
};

// Persist only the listed paths, and NEVER serialize full chat message
// histories (see stripConversationMessages) — a heavy `chat.conversations`
// blob would make every mutation JSON.stringify hundreds of MB and freeze
// the tab / OOM on send.
const persistReducer = (state: any): Record<string, any> => {
  const substate: Record<string, any> = {};
  for (const path of persistPaths) {
    let value = getPath(state, path);
    if (value === undefined) continue;
    if (path === 'chat.conversations' && Array.isArray(value)) {
      value = (value as IChatConversation[]).map((c) => stripConversationMessages(c));
    }
    setPath(substate, path, value);
  }
  return substate;
};

const store = createStore({
  ...root,
  // SSG build has no localStorage — persistedstate reads it at store creation,
  // so skip the plugin there. Client behaviour is unchanged.
  plugins: import.meta.env.SSR
    ? []
    : [
        createPersistedState({
          paths: persistPaths,
          reducer: persistReducer,
          storage: safeStorage
        })
      ]
});

export default store;
