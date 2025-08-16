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
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();

const volume = computed({
  get: () => store.state.suno.audio?.volume,
  set: (value) => store.commit('suno/setAudio', { ...store.state.suno.audio, volume: value })
});

const muted = computed({
  get: () => store.state.suno.audio?.muted,
  set: (value) => store.commit('suno/setAudio', { ...store.state.suno.audio, muted: value })
});

const setVolume = (value: any) => store.dispatch('suno/setVolume', value);
</script>
<style lang="scss">
.el-popover.el-popper {
  min-width: auto;
}
</style>
