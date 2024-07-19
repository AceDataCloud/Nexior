<template>
  <div class="player-slider">
    <el-slider
      v-model="currentTime"
      :show-tooltip="false"
      :min="0"
      :max="duration"
      @change="onSliderChange"
      @input="onSliderInput"
    />
  </div>
</template>

<script setup lang="ts">
// import { usePlayerStore } from '@/stores/player';
import { ElSlider } from 'element-plus';
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();
// 状态
const currentTime = computed({
  get: () => store.state.suno.player.currentTime,
  set: (value) => store.commit('suno/setCurrentTime', value)
});

const duration = computed({
  get: () => store.state.suno.player.duration,
  set: (value) => store.commit('suno/setDuration', value)
});

// 方法
const onSliderInput = () => store.dispatch('suno/onSliderInput');
const onSliderChange = (val: number) => store.dispatch('suno/onSliderChange', val);

// const { duration, currentTime, onSliderInput, onSliderChange } = toRefs(usePlayerStore());
</script>

<style lang="scss">
.player-slider {
  .el-slider {
    height: 10px;

    .el-slider__runway,
    .el-slider__bar {
      height: 2px;
      border-radius: 0;
    }

    .el-slider__runway {
      //@apply bg-slate-50 dark:bg-stone-700 transition-all;
      //@apply hover:bg-stone-200 dark:hover:bg-stone-600;
    }

    .el-slider__button-wrapper {
      @apply opacity-0 transition-opacity;
      width: 10px;
      height: 10px;
      top: -10.5px;
    }

    &:hover {
      .el-slider__button-wrapper {
        @apply opacity-100;
      }
    }

    .el-slider__button {
      width: 8px;
      height: 8px;
      @apply bg-emerald-400;
    }
  }
}
</style>
