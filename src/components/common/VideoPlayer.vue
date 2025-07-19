<template>
  <div class="video">
    <vue-plyr :options="options">
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
    }
  },
  data() {
    return {
      options: { quality: { default: '1080p' } }
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
