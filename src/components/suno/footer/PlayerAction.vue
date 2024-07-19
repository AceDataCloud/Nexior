<template>
  <div class="flex justify-end items-center gap-x-2.5">
    <span class="text-xs"> {{ useFormatDuring(currentTime) }} / {{ useFormatDuring(duration) }} </span>
  </div>
</template>

<script setup lang="ts">
import { MusicList, TextMessage } from '@icon-park/vue-next';
import { useFormatDuring } from '@/utils/number';
import IconPark from '@/components/common/IconPark.vue';
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();

// 创建响应式引用
// 状态
const currentTime = computed({
  get: () => store.state.suno.player.currentTime,
  set: (value) => store.commit('suno/setCurrentTime', value)
});

const duration = computed({
  get: () => store.state.suno.player.duration,
  set: (value) => store.commit('suno/setDuration', value)
});

const showPlayList = computed({
  get: () => store.state.suno.player.showPlayList,
  set: (value) => store.commit('suno/setShowPlayList', value)
});

// Getter
const playListCount = computed(() => store.getters['suno/playListCount']);
// const { currentTime, duration, playListCount, showPlayList } = storeToRefs(usePlayerStore());
</script>

<style lang="scss"></style>
