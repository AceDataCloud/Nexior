<template>
  <div class="flex-shrink-0 flex-1 flex items-center justify-between pr-5">
    <div v-for="(audio, audioIndex) in audios" :key="audioIndex">
      <div class="left">
        <el-image :src="audio?.image_url" class="cover-image" fit="cover">
          <template #placeholder>
            <div class="image-slot">...</div>
          </template>
        </el-image>
        <div class="play-overlay" @click="onTogglePlay">
          <el-icon><video-pause /></el-icon>
        </div>
        <div class="play-overlay" @click="onTogglePlay">
          <el-icon><video-play /></el-icon>
        </div>
      </div>
      <div class="info"></div>
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
  components: {},
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
    audios(): ISunoAudio[] {
      let result: ISunoAudio[] = [];
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          let audio = item as ISunoAudio;
          result.push(audio);
        });
      }
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
    }
  }
});
</script>
