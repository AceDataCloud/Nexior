<template>
  <div class="video max-w-[800px] max-h-[450px] rounded-[15px] overflow-hidden">
    <vue-plyr v-if="!failed && safeSrc" :key="safeSrc" :options="mergedOptions">
      <video controls playsinline preload="metadata" class="w-full h-full aspect-[16/9]" @error="onError">
        <source size="1080" :src="safeSrc" type="video/mp4" />
      </video>
    </vue-plyr>
    <div v-else-if="safeSrc" class="video-fallback">
      <el-button type="primary" round @click="onOpen">
        <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="mr-2" />
        {{ $t('common.button.download') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// @ts-ignore
import VuePlyr from '@skjnldsv/vue-plyr';
// @ts-ignore
import '@skjnldsv/vue-plyr/dist/vue-plyr.css';

export default defineComponent({
  name: 'VideoPlayer',
  components: { ElButton, FontAwesomeIcon, VuePlyr },
  props: {
    src: {
      type: String,
      required: true
    },
    options: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  data() {
    return {
      failed: false,
      mergedOptions: {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'captions',
          'settings',
          'pip',
          'fullscreen'
        ],
        iconUrl: 'https://cdn.acedata.cloud/7jq4t0.svg',
        quality: { default: 1080, options: [1080], ...this.options.quality },
        ...this.options
      }
    };
  },
  computed: {
    safeSrc(): string {
      return this.src.trim();
    }
  },
  watch: {
    safeSrc() {
      this.failed = false;
    }
  },
  methods: {
    onError() {
      this.failed = true;
    },
    onOpen() {
      window.open(this.safeSrc, '_blank', 'noopener,noreferrer');
    }
  }
});
</script>

<style lang="scss" scoped>
.video {
  background: var(--el-fill-color-light);
}

.video-fallback {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
