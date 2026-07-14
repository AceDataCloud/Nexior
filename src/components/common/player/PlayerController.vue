<template>
  <div class="flex items-center justify-center gap-x-3">
    <button
      v-if="hasTracks"
      type="button"
      class="player-control player-control--small cursor-pointer transition-opacity"
      :class="hasPrev ? 'text-[var(--el-text-color-regular)]' : 'opacity-30 cursor-not-allowed'"
      :disabled="!hasPrev"
      :aria-label="$t('common.player.previous')"
      :title="$t('common.player.previous')"
      @click="hasPrev && playAdjacent(-1)"
    >
      <previous-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
    <button
      v-if="audio?.state === 'playing'"
      type="button"
      class="player-control player-control--main text-[var(--el-color-primary)] cursor-pointer"
      :aria-label="$t('common.player.pause')"
      :title="$t('common.player.pause')"
      @click="togglePlay"
    >
      <pause-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
    <button
      v-else
      type="button"
      class="player-control player-control--main text-[var(--el-color-primary)] cursor-pointer"
      :aria-label="$t('common.player.play')"
      :title="$t('common.player.play')"
      @click="togglePlay"
    >
      <play-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
    <button
      v-if="hasTracks"
      type="button"
      class="player-control player-control--small cursor-pointer transition-opacity"
      :class="hasNext ? 'text-[var(--el-text-color-regular)]' : 'opacity-30 cursor-not-allowed'"
      :disabled="!hasNext"
      :aria-label="$t('common.player.next')"
      :title="$t('common.player.next')"
      @click="hasNext && playAdjacent(1)"
    >
      <next-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
    <el-popover placement="top" width="50px" trigger="click">
      <template #reference>
        <button
          type="button"
          class="player-control player-control--volume cursor-pointer"
          :aria-label="$t('common.player.volume')"
          :title="$t('common.player.volume')"
        >
          <volume-icon :stroke-width="2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        </button>
      </template>
      <player-volume-slider />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon, VolumeIcon } from '@acedatacloud/core/icons/components';
import { computed } from 'vue';
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

<style scoped>
.player-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
}

.player-control--small {
  width: 22px;
  height: 22px;
}

.player-control--main {
  width: 45px;
  height: 45px;
}

.player-control--volume {
  width: 20px;
  height: 20px;
}
</style>
