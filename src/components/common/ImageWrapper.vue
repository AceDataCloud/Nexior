<template>
  <div class="image-wrapper">
    <img v-if="src" :src="src" class="image" @error="onReload($event)" />
    <el-button v-if="rawSrc" type="info" round class="btn-raw" @click="onOpenUrl(rawSrc)">
      {{ $t('common.button.seeRawImage') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';

export default defineComponent({
  name: 'ImageWrapper',
  components: {
    ElButton
  },
  props: {
    src: {
      type: String,
      required: true
    },
    rawSrc: {
      type: String,
      required: false,
      default: undefined
    }
  },
  methods: {
    onOpenUrl(url: string) {
      window.open(url, '_blank');
    },
    onReload(event: Event) {
      const target = event.target as HTMLImageElement;
      // append a random url query to existing url query, to force reload the image
      // extract exiting url query
      const url = new URL(target.src);
      // extract `retry` query
      const retry = url.searchParams.get('retry');
      if (!retry) {
        // if no retry query, set it as random string
        url.searchParams.set('retry', '1');
      } else if (parseInt(retry) < 2) {
        // if retry < 3, increase it by 1
        url.searchParams.set('retry', (parseInt(retry) + 1).toString());
      } else {
        return;
      }
      // set the new url
      target.src = url.toString();
    }
  }
});
</script>

<style lang="scss" scoped>
.image-wrapper {
  position: relative;
  width: fit-content;
  margin-bottom: 15px;
  .image {
    max-height: 400px;
    max-width: 300px;
    min-height: 200px;
    min-width: 200px;
    border-radius: 10px;
  }
  .btn-raw {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: none;
  }
  &:hover {
    .image {
      filter: brightness(0.6);
    }
    .btn-raw {
      display: block;
    }
  }
}
</style>
