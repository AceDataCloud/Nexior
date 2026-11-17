<template>
  <div class="flex flex-col items-stretch h-20">
    <player-slider />
    <div class="player-content flex grow px-5 items-center">
      <div class="player-track flex-1">
        <player-song />
      </div>
      <div class="player-buttons flex-1">
        <player-controller />
      </div>
      <div class="player-timing flex-1">
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

<style scoped>
@media (max-width: 767px) {
  .player-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: 20px minmax(0, 1fr);
    grid-template-areas:
      'track timing'
      'buttons buttons';
    column-gap: 12px;
    min-height: 0;
    padding: 0 12px;
  }

  .player-track {
    grid-area: track;
    min-width: 0;
  }

  .player-buttons {
    grid-area: buttons;
  }

  .player-timing {
    grid-area: timing;
    white-space: nowrap;
  }
}
</style>
