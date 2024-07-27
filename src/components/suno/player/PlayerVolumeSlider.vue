<template>
  <div class="player-volume flex flex-col items-center pt-2">
    <div>
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
    </div>
    <div class="text-sm mt-3">{{ volume }}</div>
    <div class="mt-2">
      <icon-park
        :icon="muted ? VolumeMute : VolumeSmall"
        size="16"
        theme="filled"
        class="hover-text"
        @click="toggleMuted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VolumeMute, VolumeSmall } from '@icon-park/vue-next';
import IconPark from '@/components/common/IconPark.vue';
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

const toggleMuted = () => store.dispatch('suno/toggleMuted');

const setVolume = (value: number) => store.dispatch('suno/setVolume', value);
</script>
<style lang="scss">
.el-popover.el-popper {
  min-width: auto;
}
</style>
