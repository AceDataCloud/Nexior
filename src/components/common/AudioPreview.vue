<template>
  <div
    class="audio-preview w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden shadow-sm cursor-pointer flex items-center justify-center"
    :title="name"
    @click.stop="onToggle"
  >
    <font-awesome-icon
      :icon="playing ? 'fa-solid fa-pause' : 'fa-solid fa-music'"
      class="icon text-white text-[16px]"
    />
    <audio
      ref="audio"
      :src="url"
      preload="none"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'AudioPreview',
  components: {
    FontAwesomeIcon
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
      playing: false
    };
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
    }
  }
});
</script>

<style lang="scss" scoped>
.audio-preview {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  transition: filter 0.15s ease;
  &:hover {
    filter: brightness(1.08);
  }
}
</style>
