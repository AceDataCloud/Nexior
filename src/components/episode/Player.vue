<template>
  <vue-plyr ref="plyr" :options="options">
    <video ref="video" controls playsinline :data-poster="preview" :src="resource"></video>
  </vue-plyr>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';
// import Hls from 'hls.js';
// import Plyr from 'plyr';

interface IData {
  options: {};
  player?: typeof VuePlyr;
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
      type: String,
      default: undefined
    }
  },
  data(): IData {
    return {
      player: undefined,
      options: {}
    };
  },
  async unmounted() {
    this.player?.stop();
  },
  mounted() {
    this.player = (this.$refs.plyr as typeof VuePlyr).player;
  }
});
</script>
