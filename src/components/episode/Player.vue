<template>
  <vue-plyr ref="plyr" :options="options">
    <video ref="video" controls playsinline :data-poster="preview"></video>
  </vue-plyr>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';
// import Hls from 'hls.js';
// import Plyr from 'plyr';
import TcAdapter from 'tcadapter';

interface IData {
  options: {};
  player?: typeof VuePlyr;
}

export default defineComponent({
  components: {
    VuePlyr
  },
  props: {
    fileId: {
      type: String,
      required: true
    },
    sign: {
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
    if (!TcAdapter.isSupported()) {
      throw new Error('current environment can not support TcAdapter');
    }

    const adapter = new TcAdapter(
      this.$refs.video,
      {
        appID: '1500015562',
        fileID: this.fileId,
        psign: this.sign,
        hlsConfig: {}
      },
      () => {
        console.log('basicInfo', adapter.getVideoBasicInfo());
      }
    );

    this.player = (this.$refs.plyr as typeof VuePlyr).player;
  }
});
</script>
