<template>
  <div class="player-volume flex flex-col items-center pt-2">
    <div>
      <el-slider vertical height="100px" :show-tooltip="false" :max="100" :min="0" size="small" />
    </div>
    <!-- <div class="text-sm mt-3">{{ volume }}</div> -->
    <div class="mt-2">
      <IconPark :icon="VolumeSmall" size="16" theme="filled" class="hover-text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VolumeMute, VolumeSmall } from '@icon-park/vue-next';
import { toRefs } from 'vue';
// import { usePlayerStore } from '@/stores/player';
import IconPark from '@/components/common/IconPark.vue';

// const { volume, muted, toggleMuted, setVolume } = toRefs(usePlayerStore());
</script>
<style lang="scss">
.el-popover.el-popper {
  min-width: auto;
}
</style>
