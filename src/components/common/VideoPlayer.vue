<template>
  <div class="video">
    <vue-plyr :options="mergedOptions">
      <video controls crossorigin="anonymous" playsinline>
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

<style lang="scss" scoped>
.video {
  max-width: 800px;
  max-height: 450px;
  border-radius: 15px;
  overflow: hidden;
  .plyr--video,
  video {
    width: 100%;
    height: 100%;
    aspect-ratio: 16 / 9;
  }
}
</style>
