<template>
  <div class="relative">
    <div class="flex mb-2">
      <span class="text-sm font-bold">{{ $t('luma.name.extend') }}</span>
    </div>
    <div>
      <video-player v-if="config?.video_url" :src="config?.video_url" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// @ts-ignore
import { ILumaTask } from '@/models';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

export default defineComponent({
  name: 'ExtendFromInput',
  components: { VideoPlayer },
  props: {
    modelValue: {
      type: Object as () => ILumaTask | undefined,
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
      return this.$store.state.luma?.config;
    }
  }
});
</script>
