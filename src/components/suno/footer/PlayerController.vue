<template>
  <div class="flex items-center justify-center gap-x-3">
    <IconPark
      :icon="loopType === 0 ? PlayOnce : loopType === 1 ? LoopOnce : ShuffleOne"
      size="20"
      :stroke-width="3"
      class="hover-text"
      @click="toggleLoop"
    />
    <IconPark :icon="GoStart" size="28" theme="filled" class="hover-text" @click="prev" />
    <IconPark
      :icon="isPause ? Play : PauseOne"
      size="45"
      theme="filled"
      class="hover-text text-emerald-400"
      @click="togglePlay"
    />
    <IconPark :icon="GoEnd" size="28" class="hover-text" @click="next" />
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
import IconPark from '@/components/common/IconPark.vue';
import PlayerVolumeSlider from '@/components/suno/footer/PlayerVolumeSlider.vue';
import { ElPopover } from 'element-plus';
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();
// 状态
const loopType = computed({
  get: () => store.state.suno.player.loopType,
  set: (value) => store.commit('suno/setCurrentTime', value)
});

const isPause = computed({
  get: () => store.state.suno.player.isPause,
  set: (value) => store.commit('suno/setIsPause', value)
});

// 方法
const toggleLoop = () => store.dispatch('suno/toggleLoop');
const next = () => store.dispatch('suno/next');
const prev = () => store.dispatch('suno/prev');
const togglePlay = () => store.dispatch('suno/togglePlay');

// const {toggleLoop, loopType, next,prev, togglePlay, isPause} = toRefs(usePlayerStore())
</script>

<style lang="scss">
.controller-icon {
  @apply hover:text-emerald-400 cursor-pointer transition-colors;
}
</style>
