<template>
  <div>
    <vue-plyr v-if="clientReady" :options="options" class="video">
      <video controls playsinline preload="metadata" :data-poster="modelValue?.image_url">
        <source size="1080" :src="modelValue?.video_url" type="video/mp4" />
      </video>
    </vue-plyr>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
const VuePlyr = defineAsyncComponent(() => import('@skjnldsv/vue-plyr'));
// @ts-ignore
import { IPikaVideo } from '@/models';
import '@skjnldsv/vue-plyr/dist/vue-plyr.css';
export default defineComponent({
  name: 'VideoPlayer',
  components: { VuePlyr },
  props: {
    modelValue: {
      type: Object as () => IPikaVideo | undefined,
      required: true
    }
  },
  data() {
    return {
      clientReady: false,
      options: { quality: { default: 1080, options: [1080] } }
    };
  },
  mounted() {
    this.clientReady = true;
  }
});
</script>

<style lang="scss" scoped>
.video {
  max-width: 100%;
  height: 450px;
}
</style>
