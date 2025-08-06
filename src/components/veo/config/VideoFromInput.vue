<template>
  <div class="relative">
    <div class="flex mb-2">
      <span class="text-sm font-bold">{{ $t('veo.name.action3') }}</span>
    </div>
    <div>
      <video-player v-if="config?.video_url" :src="config?.video_url" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// @ts-ignore
import { IVeoTask } from '@/models';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

export default defineComponent({
  name: 'VideoFromInput',
  components: { VideoPlayer },
  props: {
    modelValue: {
      type: Object as () => IVeoTask | undefined,
      required: false,
      default: undefined
    }
  },
  data() {
    return {
      options: { quality: { default: '1080p' } }
    };
  },
  computed: {
    config() {
      return this.$store.state.veo?.config;
    }
  }
});
</script>
