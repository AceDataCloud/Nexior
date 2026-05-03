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

const store = createStore({
  ...root,
  plugins: [
    createPersistedState({
      paths: [...persistRoot, ...lazyPersistPaths]
    })
  ]
});

export default store;
