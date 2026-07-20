<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('suno.name.cover') }}</h2>
    </div>
    <div class="task">
      <div v-if="audio" class="audio" @click="onClick(audio)">
        <div v-loading="!audio?.audio_url" class="left">
          <el-image :src="audio?.image_url" class="cover" fit="cover" />
          <div
            v-if="
              audio?.audio_url &&
              $store.state?.suno?.audio?.id === audio.id &&
              $store.state?.suno?.audio?.state === 'playing'
            "
            class="overlay"
            role="button"
            tabindex="0"
            :aria-label="$t('common.player.pause')"
            :title="$t('common.player.pause')"
            @click="onPause(audio)"
            @keydown.enter.stop.prevent="onPause(audio)"
            @keydown.space.stop.prevent="onPause(audio)"
          >
            <el-icon><video-pause :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
          </div>
          <div
            v-if="
              audio?.audio_url &&
              ($store.state?.suno?.audio?.id !== audio.id ||
                ($store.state?.suno?.audio?.id === audio.id && $store.state?.suno?.audio?.state === 'paused'))
            "
            class="overlay"
            role="button"
            tabindex="0"
            :aria-label="$t('common.player.play')"
            :title="$t('common.player.play')"
            @click="onPlay(audio)"
            @keydown.enter.stop.prevent="onPlay(audio)"
            @keydown.space.stop.prevent="onPlay(audio)"
          >
            <el-icon><video-play :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
          </div>
          <div v-if="audio?.duration" class="duration">
            {{ useFormatDuring(audio?.duration) }}
          </div>
        </div>
        <div class="info">
          <h2 class="title">{{ audio?.title }}</h2>
          <p class="style">{{ audio?.style }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PlayIcon as VideoPlay, PauseIcon as VideoPause } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { ISunoAudio } from '@/models';
import { ElImage, ElIcon } from 'element-plus';

export const DEFAULT_LYRIC = '';

export default defineComponent({
  name: 'CoverFromInput',
  components: {
    ElImage,
    ElIcon,
    VideoPlay,
    VideoPause
  },
  data() {
    return {};
  },
  computed: {
    // @ts-ignore
    audio() {
      // @ts-ignore
      return this.$store.state.suno?.config?.audio;
    },
    value: {
      get() {
        return this.$store.state.suno?.config?.continue_at;
      },
      set(val: string) {
        console.debug('set continue_at', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          continue_at: val ? parseInt(val) : undefined
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
  },
  methods: {
    handleChange(val: number) {
      if (val < 0) {
        this.value = 0;
        // @ts-ignore
      } else if (val > this.audio?.duration) {
        this.value = this.audio?.duration;
      } else {
        this.value = val;
      }
    },
    useFormatDuring,
    onPlay(audio: ISunoAudio) {
      this.$store.dispatch('suno/setAudio', {
        ...this.$store.state.suno.audio,
        ...audio,
        state: 'playing'
      });
      console.log('on play');
    },
    onPause(audio: ISunoAudio) {
      this.$store.dispatch('suno/setAudio', {
        ...this.$store.state.suno.audio,
        ...audio,
        state: 'paused'
      });
      console.log('on pause');
    },
    onClick(audio: ISunoAudio) {
      if (this.$store.state?.suno?.audio?.id !== audio.id) {
        this.onPlay({
          ...audio,
          progress: 0
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between; // 添加这行
    position: relative;
    margin-bottom: 10px;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .input-wrapper {
      width: 150px; // 根据需要调整宽度
      margin-left: 30px; // 增加左边距
    }
  }
}
</style>
