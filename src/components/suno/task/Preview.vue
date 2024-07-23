<template>
  <div class="task">
    <div v-for="(audio, audioIndex) in audios" :key="audioIndex" class="audio" @click="onClick(audio)">
      <div class="left">
        <el-image :src="audio?.image_url" class="cover" fit="cover">
          <template #placeholder>
            <div class="image-slot">...</div>
          </template>
        </el-image>
        <div class="overlay" @click="onTogglePlay">
          <el-icon><video-pause /></el-icon>
        </div>
        <div class="overlay" @click="onTogglePlay">
          <el-icon><video-play /></el-icon>
        </div>
      </div>
      <div class="info">
        <h2 class="title">{{ audio?.title }}</h2>
        <p class="style">{{ audio?.style }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useFormatDuring } from '@/utils/number';
import { ISunoAudio, ISunoTask } from '@/models';
import { ElButton, ElImage, ElIcon } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ElIcon,
    VideoPlay,
    VideoPause
  },
  props: {
    modelValue: {
      type: Object as () => ISunoTask,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    task() {
      return this.$store.state.suno?.tasks;
    },
    audios(): ISunoAudio[] {
      let result: ISunoAudio[] = [];
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          let audio = item as ISunoAudio;
          result.push(audio);
        });
      }
      console.log('audios', result);
      return result;
    },
    application() {
      return this.$store.state.suno?.application;
    },
    active() {
      return this.$store.state.suno?.tasks?.active;
    }
  },
  methods: {
    useFormatDuring,
    onTogglePlay() {
      console.log('on toggle play');
    },
    onClick(audio: ISunoAudio) {
      console.log('on click', audio);
    }
  }
});
</script>

<style lang="scss">
.task {
  display: flex;
  flex-direction: column;
  .audio {
    display: flex;
    margin-bottom: 10px;
    .left {
      position: relative;
      width: 100px;
      height: 100px;
      margin-right: 16px;
      flex-shrink: 0;

      &:hover .overlay {
        display: block;
      }

      .cover {
        width: 100%;
        height: 100%;
        border-radius: 4px;
      }
      .duration {
        position: absolute;
        right: 4px;
        bottom: 4px;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 2px 4px;
        border-radius: 2px;
        font-size: 12px;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        display: none;
        transition: opacity 0.3s;
        border-radius: 4px;
        text-align: center;
        line-height: 120px;
        cursor: pointer;
        .el-icon {
          font-size: 40px;
          color: white;
        }
      }
    }
    .info {
      flex: 1;
      .title {
        font-size: 16px;
        font-weight: bold;
      }
      .style {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
