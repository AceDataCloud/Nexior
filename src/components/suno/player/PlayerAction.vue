<template>
  <div class="flex justify-end items-center gap-x-2.5">
    <span class="text-xs"> {{ useFormatDuring(progress) }} / {{ useFormatDuring(duration) }} </span>
  </div>
</template>

<script setup lang="ts">
import { useFormatDuring } from '@/utils/number';
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const progress = computed({
  get: () => store.state.suno?.audio?.progress,
  set: (value) =>
    store.commit('suno/setAudio', {
      ...store.state.suno.audio,
      progress: value
    })
});

const duration = computed({
  get: () => store.state.suno?.audio?.duration,
  set: (value) =>
    store.commit('suno/setAudio', {
      ...store.state.suno.audio,
      duration: value
    })
});
</script>

<style lang="scss"></style>
