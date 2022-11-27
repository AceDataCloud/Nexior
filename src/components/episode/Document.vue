<template>
  <div class="document">
    <div class="content">
      <pdf v-if="resourceUrl" :source="resourceUrl"></pdf>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Pdf from 'vue-pdf-embed';

interface IData {
  options: {};
}

export default defineComponent({
  name: 'EpisodeDocument',
  components: {
    Pdf
  },
  props: {
    resourceUrl: {
      type: String,
      required: true
    }
  },
  data(): IData {
    return {
      options: {}
    };
  },
  async unmounted() {},
  mounted() {}
});
</script>

<style lang="scss" scoped>
.document {
  overflow: hidden;
  border-radius: 15px;
  width: calc(100% - 30px);
  height: 80vh;
  position: relative;
  top: 15px;
  left: 15px;
  .content {
    overflow: scroll;
  }
}
</style>
