<template>
  <div class="player-slider">
    <el-slider
      v-model="progress"
      :show-tooltip="false"
      :min="0"
      :max="duration"
      @change="onSliderChange"
      @input="onSliderInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ElSlider } from 'element-plus';
import { useAudioState } from './useAudioState';

const { field, dispatchAudio } = useAudioState();

const progress = field<number>('progress');
const duration = field<number>('duration');

const onSliderInput = () => {};
const onSliderChange = (val: number | number[]) => dispatchAudio({ progress: Array.isArray(val) ? val[0] : val });
</script>

<style lang="scss">
.player-slider {
  .el-slider {
    height: 12px;

    .el-slider__runway,
    .el-slider__bar {
      height: 4px;
      border-radius: 2px;
    }

    .el-slider__button-wrapper {
      width: 16px;
      height: 16px;
      top: -12px;
    }

    // Handle stays small until hover/drag, so the bar reads clean but is grabbable
    .el-slider__button {
      width: 10px;
      height: 10px;
      border-width: 2px;
      transition:
        transform 0.15s,
        box-shadow 0.15s;
    }

    &:hover .el-slider__button {
      transform: scale(1.3);
    }
  }
}
</style>
