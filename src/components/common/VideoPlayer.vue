<template>
  <div class="video max-w-[800px] max-h-[450px] rounded-[15px] overflow-hidden">
    <vue-plyr :options="mergedOptions">
      <video controls crossorigin="anonymous" playsinline class="w-full h-full aspect-[16/9]">
        <source size="1080" :src="src" type="video/mp4" />
      </video>
    </vue-plyr>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// @ts-ignore
import VuePlyr from '@skjnldsv/vue-plyr';
// @ts-ignore
import '@skjnldsv/vue-plyr/dist/vue-plyr.css';

export default defineComponent({
  name: 'VideoPlayer',
  components: { VuePlyr },
  props: {
    src: {
      type: String,
      required: true
    },
    options: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  data() {
    return {
      mergedOptions: {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'captions',
          'settings',
          'pip',
          'fullscreen'
        ],
        iconUrl: 'https://cdn.acedata.cloud/7jq4t0.svg',
        quality: { default: '1080p', ...this.options.quality },
        ...this.options
      }
    };
  }
});
</script>
