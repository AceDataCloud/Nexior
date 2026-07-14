<template>
  <button
    type="button"
    class="audio-preview w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden shadow-sm cursor-pointer flex items-center justify-center"
    :title="accessibleLabel"
    :aria-label="accessibleLabel"
    :disabled="failed"
    @click.stop="onToggle"
  >
    <warning-icon
      v-if="failed"
      class="icon text-white text-[16px]"
      :size="'1em' as any"
      aria-hidden="true"
      focusable="false"
    />
    <pause-icon
      v-else-if="playing"
      class="icon text-white text-[16px]"
      :size="'1em' as any"
      aria-hidden="true"
      focusable="false"
    />
    <music-icon v-else class="icon text-white text-[16px]" :size="'1em' as any" aria-hidden="true" focusable="false" />
    <audio
      ref="audio"
      :src="url"
      preload="none"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @error="onError"
    />
  </button>
</template>

<script lang="ts">
import { MusicIcon, PauseIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AudioPreview',
  components: {
    MusicIcon,
    PauseIcon,
    WarningIcon
  },
  props: {
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false,
      default: 'audio'
    }
  },
  data() {
    return {
      playing: false,
      failed: false
    };
  },
  computed: {
    accessibleLabel(): string {
      return this.failed ? `${this.name}: ${this.$t('common.message.mediaPreviewUnavailable')}` : this.name;
    }
  },
  methods: {
    onToggle() {
      const audio = this.$refs.audio as HTMLAudioElement | undefined;
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch(() => {
          this.playing = false;
        });
      } else {
        audio.pause();
      }
    },
    onError() {
      this.playing = false;
      this.failed = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.audio-preview {
  padding: 0;
  border: 0;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  transition: filter 0.15s ease;
  &:hover {
    filter: brightness(1.08);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary-light-5);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
}
</style>
