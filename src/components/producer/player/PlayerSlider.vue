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
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const progress = computed({
  get: () => store.state.producer?.audio?.progress,
  set: (value) =>
    store.commit('producer/setAudio', {
      ...store.state.producer.audio,
      progress: value
    })
});

const duration = computed({
  get: () => store.state.producer?.audio?.duration,
  set: (value) => store.commit('producer/setAudio', { ...store.state.producer.audio, duration: value })
});

const onSliderInput = () => {};
const onSliderChange = (val: any) =>
  store.dispatch('producer/setAudio', {
    ...store.state.producer.audio,
    progress: val
  });
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
    }

    .el-slider__button-wrapper {
      width: 10px;
      height: 10px;
      top: -10.5px;
    }

    &:hover {
      .el-slider__button-wrapper {
      }
    }

    .el-slider__button {
      width: 8px;
      height: 8px;
    }
  }
}
</style>
