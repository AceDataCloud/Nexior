<template>
  <vue-plyr :options="options" ref="plyr">
    <video controls playsinline :data-poster="preview" ref="video"></video>
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
  mounted() {
    const video = this.$refs.video as HTMLMediaElement;
    const hls = new Hls();
    hls.loadSource(this.resource);
    hls.attachMedia(video);
  },
  data(): IData {
    return {
      options: {}
    };
  }
});
</script>
