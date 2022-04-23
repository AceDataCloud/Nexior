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
// import Plyr from 'plyr';

interface IData {
  options: {};
  player?: typeof VuePlyr;
  mounted: boolean;
  hls?: any;
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
      player: undefined,
      options: {},
      mounted: false,
      hls: undefined
    };
  },
  async unmounted() {
    console.log('un');
    this.player?.stop();
    this.hls?.stopLoad();
  },
  mounted() {
    this.mounted = true;
    const video = this.$refs.video as HTMLMediaElement;
    this.player = (this.$refs.plyr as typeof VuePlyr).player;
    this.hls = new Hls() as Hls;
    this.hls?.loadSource(this.resource);
    this.hls?.attachMedia(video);
  }
});
</script>
