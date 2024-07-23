<template>
  <div class="flex player-song">
    <img alt="" class="w-11 h-11 rounded" :src="audio?.image_url || OpticalDisk" />
    <div class="ml-2 text-xs flex flex-col justify-between">
      <div class="w-52 2xl:w-96 cursor-pointer truncate">
        <div class="flex">
          <span>{{ audio?.title || 'Music' }}</span>
          <span class="ml-2 text-dc">- {{ audio?.style || `SmallRuralDog` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Like, DownTwo, MoreTwo, Comment, ThumbsUp, ThumbsDown, Share, MoreFour, MoreThree } from '@icon-park/vue-next';
// import { usePlayerStore } from '@/stores/player';
import { OpticalDisk } from '@/assets/img';
import IconPark from '@/components/common/IconPark.vue';
import { ElBadge } from 'element-plus';

import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();
const audio = computed({
  get: () => store.state.suno.audio,
  set: (value) => store.commit('suno/setAudio', value)
});

// const duration = computed({
//   get: () => store.state.suno.player.duration,
//   set: (value) => store.commit('suno/setDuration', value)
// });

// // 方法
// const onSliderInput = () => store.dispatch('suno/onSliderInput');
// const onSliderChange = () => store.dispatch('suno/onSliderChange');

// const { song, songUrl } = toRefs(usePlayerStore());
</script>

<style lang="scss">
.player-song {
  .badge {
    .el-badge__content {
      @apply scale-75 left-1 bg-stone-100 text-slate-500 bg-opacity-80 right-auto;
      @apply dark:bg-stone-900;
    }
  }
}
</style>
