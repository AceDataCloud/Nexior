import { computed, inject, type ComputedRef, type InjectionKey, type WritableComputedRef } from 'vue';
import { useStore } from 'vuex';

export type AudioNamespace = 'suno' | 'producer';

export const AudioNamespaceKey: InjectionKey<AudioNamespace> = Symbol('AudioNamespace');

/**
 * Optional ordered playback queue, provided by the host list so prev/next
 * follow the *visible* order (respecting the list's search/filter/sort)
 * rather than the raw store order. When absent, the queue is derived from
 * the namespace's task history.
 */
export const AudioQueueKey: InjectionKey<ComputedRef<Record<string, any>[]>> = Symbol('AudioQueue');

export const useAudioNamespace = (): AudioNamespace => {
  const ns = inject(AudioNamespaceKey);
  if (!ns) {
    throw new Error('[player] useAudioNamespace() must be called inside <Player namespace="suno|producer">');
  }
  return ns;
};

/**
 * Shared audio-state helpers for the Suno / Producer players.
 *
 * Both namespaces store their currently-playing track at
 * `store.state[ns].audio` (see `ISunoAudio` / `IProducerAudio` —
 * structurally identical) and expose the same `<ns>/setAudio` mutation
 * + `<ns>/setVolume` action. This wraps the boilerplate so each player
 * sub-component stays a one-liner over `audio()` / `field()`.
 */
export const useAudioState = (namespace?: AudioNamespace) => {
  const ns = namespace ?? useAudioNamespace();
  const store = useStore();

  const audio = computed({
    get: () => store.state[ns].audio,
    set: (value) => store.commit(`${ns}/setAudio`, value)
  });

  const patchAudio = (patch: Record<string, unknown>) => {
    store.commit(`${ns}/setAudio`, { ...store.state[ns].audio, ...patch });
  };

  const dispatchAudio = (patch: Record<string, unknown>) => {
    store.dispatch(`${ns}/setAudio`, { ...store.state[ns].audio, ...patch });
  };

  /**
   * Two-way binding for a single field on the current audio object.
   * `set` commits a shallow-merged copy, mirroring the original
   * `{ ...store.state.<ns>.audio, [field]: value }` pattern.
   */
  const field = <T = unknown>(name: string): WritableComputedRef<T> =>
    computed({
      get: () => store.state[ns].audio?.[name] as T,
      set: (value: T) => patchAudio({ [name]: value })
    });

  // Ordered, visible queue provided by the host list (RecentPanel), if any.
  const injectedQueue = inject(AudioQueueKey, undefined);

  /**
   * Flat, ordered list of playable tracks for prev/next navigation. Prefers
   * the host-provided visible queue (so it respects search/filter/sort);
   * falls back to the namespace's raw task history. Both `suno` and
   * `producer` stores share the `tasks.items[].response.data[]` shape; if a
   * namespace lacks it the list is simply empty (prev/next hide).
   */
  const tracks = computed<Record<string, any>[]>(() => {
    const external = injectedQueue?.value;
    if (external && external.length) return external;
    const items = (store.state[ns]?.tasks?.items ?? []) as Record<string, any>[];
    const list: Record<string, any>[] = [];
    for (const t of items) {
      for (const a of (t?.response?.data ?? []) as Record<string, any>[]) {
        if (a?.audio_url) list.push(a);
      }
    }
    return list;
  });

  const currentIndex = computed(() => {
    const id = store.state[ns].audio?.id;
    return tracks.value.findIndex((a) => a.id === id);
  });

  const playAdjacent = (dir: 1 | -1) => {
    const idx = currentIndex.value;
    if (idx === -1) return;
    const next = tracks.value[idx + dir];
    if (!next) return;
    store.dispatch(`${ns}/setAudio`, {
      ...store.state[ns].audio,
      ...next,
      progress: 0,
      state: 'playing'
    });
  };

  return {
    namespace: ns,
    store,
    audio,
    field,
    patchAudio,
    dispatchAudio,
    tracks,
    currentIndex,
    playAdjacent
  };
};
