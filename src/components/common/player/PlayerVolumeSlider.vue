<template>
  <div class="player-volume flex flex-col items-center pt-2">
    <el-slider
      v-model="volume"
      vertical
      height="100px"
      :show-tooltip="false"
      :max="100"
      :min="0"
      size="small"
      :disabled="muted"
      @input="setVolume"
    />
    <div class="text-sm mt-3">{{ volume }}</div>
  </div>
</template>

<script setup lang="ts">
import { ElSlider } from 'element-plus';
import { useAudioState } from './useAudioState';

const { namespace, store, field } = useAudioState();

const volume = field<number>('volume');
const muted = field<boolean>('muted');

const setVolume = (value: number) => store.dispatch(`${namespace}/setVolume`, value);
</script>
<style lang="scss">
.el-popover.el-popper {
  min-width: auto;
}
</style>
