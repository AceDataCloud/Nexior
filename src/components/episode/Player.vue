<template>
  <vue-plyr :options="options">
    <video controls playsinline :data-poster="preview">
      <source size="1080" :src="resource" type="video/mp4" />
    </video>
  </vue-plyr>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';

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
  }
});
</script>

