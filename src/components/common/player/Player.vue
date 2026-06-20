<template>
  <div class="flex flex-col items-stretch h-20">
    <player-slider />
    <div class="flex grow px-5 items-center">
      <div class="flex-1">
        <player-song />
      </div>
      <div class="flex-1">
        <player-controller />
      </div>
      <div class="flex-1">
        <player-action />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue';
import PlayerSlider from './PlayerSlider.vue';
import PlayerSong from './PlayerSong.vue';
import PlayerAction from './PlayerAction.vue';
import PlayerController from './PlayerController.vue';
import { AudioNamespaceKey, AudioQueueKey, type AudioNamespace } from './useAudioState';

// `tracks` is the visible, ordered playback queue from the host list (optional;
// when omitted, prev/next falls back to the namespace's task history).
const props = defineProps<{ namespace: AudioNamespace; tracks?: Record<string, any>[] }>();

provide(AudioNamespaceKey, props.namespace);
provide(
  AudioQueueKey,
  computed(() => props.tracks ?? [])
);
</script>
