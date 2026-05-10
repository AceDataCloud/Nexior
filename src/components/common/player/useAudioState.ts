import { computed, inject, type InjectionKey, type WritableComputedRef } from 'vue';
import { useStore } from 'vuex';

export type AudioNamespace = 'suno' | 'producer';

export const AudioNamespaceKey: InjectionKey<AudioNamespace> = Symbol('AudioNamespace');

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

  return {
    namespace: ns,
    store,
    audio,
    field,
    patchAudio,
    dispatchAudio
  };
};
