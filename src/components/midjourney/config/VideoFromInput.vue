<template>
  <div class="relative">
    <div class="flex mb-2">
      <span class="text-sm font-bold">{{ $t('midjourney.name.extend') }}</span>
    </div>
    <div>
      <video-player v-if="config?.video_url" :src="config?.video_url" :options="options" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// @ts-ignore
import { IMidjourneyTask } from '@/models';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

export default defineComponent({
  name: 'VideoFromInput',
  components: { VideoPlayer },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyTask | undefined,
      required: false,
      default: undefined
    }
  },
  data() {
    return {
      options: {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'captions', 'settings', 'fullscreen']
      }
    };
  },
  computed: {
    config() {
      return this.$store.state.midjourney?.config;
    }
  }
});
</script>
