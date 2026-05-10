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
const onSliderChange = (val: number) => dispatchAudio({ progress: val });
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

    .el-slider__button-wrapper {
      width: 10px;
      height: 10px;
      top: -10.5px;
    }

    .el-slider__button {
      width: 8px;
      height: 8px;
    }
  }
}
</style>
