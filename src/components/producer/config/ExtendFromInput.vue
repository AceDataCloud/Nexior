<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('producer.name.extend') }}</h2>
      <div class="input-wrapper">
        <el-input-number
          v-model="value"
          class="value"
          :min="0"
          :max="audio?.duration"
          :controls="false"
          :placeholder="$t('producer.placeholder.extend.continue_at')"
          @change="handleChange"
        />
      </div>
    </div>
    <div class="task">
      <div v-if="audio" class="audio" @click="onClick(audio)">
        <div v-loading="!audio?.audio_url" class="left">
          <el-image :src="audio?.image_url" class="cover" fit="cover" />
          <div
            v-if="
              audio?.audio_url &&
              $store.state?.producer?.audio?.id === audio.id &&
              $store.state?.producer?.audio?.state === 'playing'
            "
            class="overlay"
            @click="onPause(audio)"
          >
            <el-icon><video-pause /></el-icon>
          </div>
          <div
            v-if="
              audio?.audio_url &&
              ($store.state?.producer?.audio?.id !== audio.id ||
                ($store.state?.producer?.audio?.id === audio.id && $store.state?.producer?.audio?.state === 'paused'))
            "
            class="overlay"
            @click="onPlay(audio)"
          >
            <el-icon><video-play /></el-icon>
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
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { IProducerAudio } from '@/models';
import { ElImage, ElIcon, ElInputNumber } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ExtendFromInput',
  components: {
    ElImage,
    ElIcon,
    ElInputNumber,
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
      return this.$store.state.producer?.config?.audio;
    },
    value: {
      get() {
        return this.$store.state.producer?.config?.continue_at;
      },
      set(val: string) {
        console.debug('set continue_at', val);
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
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
    handleChange(val: number | undefined) {
      if (val === undefined) {
        this.value = undefined;
        return;
      }
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
    onPlay(audio: IProducerAudio) {
      this.$store.dispatch('producer/setAudio', {
        ...this.$store.state.producer.audio,
        ...audio,
        state: 'playing'
      });
      console.log('on play');
    },
    onPause(audio: IProducerAudio) {
      this.$store.dispatch('producer/setAudio', {
        ...this.$store.state.producer.audio,
        ...audio,
        state: 'paused'
      });
      console.log('on pause');
    },
    onClick(audio: IProducerAudio) {
      if (this.$store.state?.producer?.audio?.id !== audio.id) {
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
    justify-content: space-between;
    position: relative;
    margin-bottom: 10px;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .input-wrapper {
      width: 150px;
      margin-left: 30px;
    }
  }
}
</style>
