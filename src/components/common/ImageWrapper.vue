<template>
  <div class="image-wrapper">
    <img
      v-if="displaySrc"
      :src="displaySrc"
      class="image cursor-zoom-in"
      @error="onReload"
      @click="showViewer = true"
    />
    <el-button v-if="rawSrc" type="info" round class="btn-raw" @click.stop="onOpenUrl(rawSrc)">
      {{ $t('common.button.seeRawImage') }}
    </el-button>
    <el-image-viewer
      v-if="showViewer"
      :url-list="[rawSrc || displaySrc]"
      teleported
      hide-on-click-modal
      @close="showViewer = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElImageViewer } from 'element-plus';

export default defineComponent({
  name: 'ImageWrapper',
  components: {
    ElButton,
    ElImageViewer
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
  data() {
    return {
      showViewer: false,
      // Displayed src is kept in sync with retries so the lightbox uses the URL that actually loaded.
      displaySrc: this.src
    };
  },
  watch: {
    src(value: string) {
      this.displaySrc = value;
    }
  },
  methods: {
    onOpenUrl(url: string) {
      window.open(url, '_blank');
    },
    onReload(event: Event) {
      const target = event.target as HTMLImageElement;
      // append a retry query to force reload the image
      const url = new URL(target.src);
      const retry = url.searchParams.get('retry');
      if (!retry) {
        url.searchParams.set('retry', '1');
      } else if (parseInt(retry) < 2) {
        url.searchParams.set('retry', (parseInt(retry) + 1).toString());
      } else {
        return;
      }
      this.displaySrc = url.toString();
    }
  }
});
</script>

<style lang="scss" scoped>
.image-wrapper {
  position: relative;
  width: fit-content;
  margin-bottom: 16px;
  .image {
    max-height: 400px;
    max-width: 300px;
    min-height: 200px;
    min-width: 200px;
    border-radius: 16px;
    transition: filter 0.2s ease;
    box-shadow: var(--app-shadow-sm);
    @media (max-width: 767px) {
      max-width: 100%;
      height: auto;
    }
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
