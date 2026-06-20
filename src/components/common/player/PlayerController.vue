<template>
  <div class="flex items-center justify-center gap-x-3">
    <icon-park
      v-if="hasTracks"
      :icon="GoStart"
      size="22"
      theme="filled"
      class="cursor-pointer transition-opacity"
      :class="hasPrev ? 'text-[var(--el-text-color-regular)]' : 'opacity-30 cursor-not-allowed'"
      @click="hasPrev && playAdjacent(-1)"
    />
    <icon-park
      :icon="audio?.state === 'playing' ? PauseOne : Play"
      size="45"
      theme="filled"
      class="text-[var(--el-color-primary)] cursor-pointer"
      @click="togglePlay"
    />
    <icon-park
      v-if="hasTracks"
      :icon="GoEnd"
      size="22"
      theme="filled"
      class="cursor-pointer transition-opacity"
      :class="hasNext ? 'text-[var(--el-text-color-regular)]' : 'opacity-30 cursor-not-allowed'"
      @click="hasNext && playAdjacent(1)"
    />
    <el-popover placement="top" width="50px" trigger="click">
      <template #reference>
        <icon-park :icon="VolumeSmall" size="20" :stroke-width="2" class="cursor-pointer" />
      </template>
      <player-volume-slider />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Play, PauseOne, VolumeSmall, GoStart, GoEnd } from '@icon-park/vue-next';
import IconPark from '@/components/common/IconPark.vue';
import PlayerVolumeSlider from './PlayerVolumeSlider.vue';
import { ElPopover } from 'element-plus';
import { useAudioState } from './useAudioState';

const { audio, dispatchAudio, tracks, currentIndex, playAdjacent } = useAudioState();

const hasTracks = computed(() => tracks.value.length > 1);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value !== -1 && currentIndex.value < tracks.value.length - 1);

const togglePlay = () =>
  dispatchAudio({
    state: audio.value?.state === 'playing' ? 'paused' : 'playing'
  });
</script>
