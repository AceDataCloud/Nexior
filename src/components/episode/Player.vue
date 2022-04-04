<template>
  <vue-plyr ref="plyr" :options="options">
    <video ref="video" controls playsinline :data-poster="preview"></video>
  </vue-plyr>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';
import Hls from 'hls.js';

interface IData {
  options: {};
}

export default defineComponent({
  components: {
    VuePlyr
  },
  props: {
    resource: {
      type: String,
      required: true
    },
    preview: {
      type: String
    }
  },
  data(): IData {
    return {
      options: {}
    };
  },
  mounted() {
    const video = this.$refs.video as HTMLMediaElement;
    const hls = new Hls();
    hls.loadSource(this.resource);
    hls.attachMedia(video);
  }
});
</script>
