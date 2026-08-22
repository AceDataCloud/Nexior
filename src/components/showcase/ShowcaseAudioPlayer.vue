<template>
  <div class="showcase-audio-player">
    <img :src="cover" :alt="title" />
    <strong>{{ title }}</strong>
    <audio ref="audio" :src="src" controls preload="metadata" @play="$emit('play')" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

defineProps<{ src: string; cover: string; title: string }>();
defineEmits<{ play: [] }>();
const audio = ref<HTMLAudioElement>();
function stop(): void {
  audio.value?.pause();
}
onBeforeUnmount(stop);
defineExpose({ stop });
</script>

<style lang="scss" scoped>
.showcase-audio-player {
  display: grid;
  width: min(460px, 90%);
  gap: 16px;
  justify-items: center;
  color: #fff;

  img {
    width: min(360px, 100%);
    aspect-ratio: 1;
    border-radius: 18px;
    object-fit: cover;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.48);
  }

  strong {
    font-size: 20px;
  }

  audio {
    width: 100%;
  }
}
</style>
