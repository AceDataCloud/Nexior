import type { Module } from 'vuex';
import store from './index';

// Each loader returns the per-module Vuex `Module` from
// `src/store/<name>/index.ts`. We type it as `Module<any, any>` because
// each module exports a concrete `Module<IConcreteState, IRootState>`
// shape — Vuex's GetterTree / ActionTree type parameters make those
// individually-typed modules structurally incompatible with a single
// `Module<unknown, unknown>` generic. `store.registerModule` only cares
// about the runtime shape, so this loose typing is correct here.
type AnyVuexModule = Module<any, any>;

/**
 * Per-app store modules are registered lazily so that opening (e.g.) the
 * ChatGPT page never loads the Suno / Midjourney / Luma / Sora / Veo /
 * Pixverse / … modules and their operators. Each loader resolves to the
 * default-exported Vuex module from `src/store/<name>/index.ts`.
 *
 * Adding a new module: create `src/store/<name>/index.ts` (plus the existing
 * `state.ts` / `mutations.ts` / `actions.ts` / `persist.ts` files), then add
 * a single entry below. The router (`src/router/index.ts`) maps each route's
 * `meta.appName` to one of these names.
 */
const moduleLoaders: Record<string, () => Promise<{ default: AnyVuexModule }>> = {
  chat: () => import('./chat'),
  midjourney: () => import('./midjourney'),
  qrart: () => import('./qrart'),
  luma: () => import('./luma'),
  pika: () => import('./pika'),
  kling: () => import('./kling'),
  veo: () => import('./veo'),
  sora: () => import('./sora'),
  pixverse: () => import('./pixverse'),
  flux: () => import('./flux'),
  hailuo: () => import('./hailuo'),
  headshots: () => import('./headshots'),
  suno: () => import('./suno'),
  producer: () => import('./producer'),
  nanobanana: () => import('./nanobanana'),
  openaiimage: () => import('./openaiimage'),
  seedream: () => import('./seedream'),
  seedance: () => import('./seedance'),
  serp: () => import('./serp'),
  wan: () => import('./wan')
};

/** Names of every lazy-registerable per-app module (single source of truth). */
export const LAZY_MODULE_NAMES = Object.keys(moduleLoaders) as Array<keyof typeof moduleLoaders>;

const inFlight = new Map<string, Promise<void>>();

/**
 * Read `vuex-persistedstate`'s saved blob from localStorage. We use the same
 * default key (`'vuex'`) as the persistence plugin in `src/store/index.ts`,
 * so any state that the plugin saved before the user reloaded the page is
 * restored when its owning module is registered later.
 */
function readSavedRootState(): Record<string, unknown> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem('vuex');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Lazily register a per-app store module. Returns a promise that resolves
 * once the module is loaded *and* registered; concurrent calls for the same
 * name de-dupe, and repeated calls after registration are cheap no-ops.
 */
export async function ensureStoreModule(name: string): Promise<void> {
  if (!Object.prototype.hasOwnProperty.call(moduleLoaders, name)) {
    return;
  }
  if (store.hasModule(name)) {
    return;
  }
  const existing = inFlight.get(name);
  if (existing) {
    return existing;
  }
  const task = (async () => {
    const mod = await moduleLoaders[name]();
    if (store.hasModule(name)) {
      return;
    }
    const baseModule = mod.default;
    const baseState =
      typeof baseModule.state === 'function'
        ? (baseModule.state as () => unknown)()
        : { ...(baseModule.state as object) };
    const saved = readSavedRootState()[name];
    const initialState =
      saved && typeof saved === 'object' ? { ...(baseState as object), ...(saved as object) } : baseState;
    store.registerModule(name, {
      ...baseModule,
      state: initialState
    });
  })().finally(() => {
    inFlight.delete(name);
  });
  inFlight.set(name, task);
  return task;
}

/**
 * Helper for code paths (e.g. logout) that need to fan out to every
 * registered module without forcing unloaded ones to be loaded just to be
 * reset.
 */
export function getRegisteredLazyModules(): string[] {
  return LAZY_MODULE_NAMES.filter((name) => store.hasModule(name));
}
