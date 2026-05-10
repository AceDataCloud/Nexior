<template>
  <div class="flex items-center justify-center gap-x-3">
    <icon-park
      :icon="audio?.state === 'playing' ? PauseOne : Play"
      size="45"
      theme="filled"
      class="text-[var(--el-color-primary)] cursor-pointer"
      @click="togglePlay"
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
import { Play, PauseOne, VolumeSmall } from '@icon-park/vue-next';
import IconPark from '@/components/common/IconPark.vue';
import PlayerVolumeSlider from './PlayerVolumeSlider.vue';
import { ElPopover } from 'element-plus';
import { useAudioState } from './useAudioState';

const { audio, dispatchAudio } = useAudioState();

const togglePlay = () =>
  dispatchAudio({
    state: audio.value?.state === 'playing' ? 'paused' : 'playing'
  });
</script>
