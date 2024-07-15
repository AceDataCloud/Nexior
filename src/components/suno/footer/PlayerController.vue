<template>
  <div class="flex items-center justify-center gap-x-3">
    <!-- 歌曲的单曲循环和列表循环 -->
    <IconPark :icon="ShuffleOne" size="20" :stroke-width="3" class="hover-text" />
    <!-- 上一首 -->
    <IconPark :icon="GoStart" size="28" theme="filled" class="hover-text" />
    <!-- 播放与暂停 -->
    <IconPark :icon="Play" size="45" theme="filled" class="hover-text text-emerald-400" />
    <!-- 下一首 -->
    <IconPark :icon="GoEnd" size="28" class="hover-text" />
    <!-- 音量控制 -->
    <el-popover placement="top" width="50px">
      <template #reference>
        <IconPark :icon="VolumeSmall" size="20" :stroke-width="3" class="hover-text" />
      </template>
      <PlayerVolumeSlider />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Play, PauseOne, LoopOnce, ShuffleOne, PlayOnce, GoEnd, GoStart, VolumeSmall } from '@icon-park/vue-next';
import { toRefs } from 'vue';
import IconPark from '@/components/common/IconPark.vue';
import { ElPopover } from 'element-plus';
import PlayerVolumeSlider from './PlayerVolumeSlider.vue';
// import { usePlayerStore } from '@/stores/player';

// const { toggleLoop, loopType, next, prev, togglePlay, isPause } = toRefs(usePlayerStore());
</script>

<style lang="scss">
.controller-icon {
  @apply hover:text-emerald-400 cursor-pointer transition-colors;
}
</style>
