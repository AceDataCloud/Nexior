<template>
  <div
    class="video-preview w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden shadow-sm cursor-pointer bg-[var(--el-fill-color-darker)]"
    :title="name"
    @click.stop="open = true"
  >
    <video class="w-full h-full object-cover" :src="`${url}#t=0.1`" muted preload="metadata" playsinline />
    <div class="overlay absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.25)]">
      <font-awesome-icon icon="fa-solid fa-play" class="text-white text-[14px]" />
    </div>
    <el-dialog
      v-model="open"
      width="640"
      align-center
      append-to-body
      destroy-on-close
      class="video-preview-dialog"
      @click.stop
    >
      <video-player :src="url" />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

export default defineComponent({
  name: 'VideoPreview',
  components: {
    ElDialog,
    FontAwesomeIcon,
    VideoPlayer
  },
  props: {
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false,
      default: 'video'
    }
  },
  data() {
    return {
      open: false
    };
  }
});
</script>

<style lang="scss" scoped>
.video-preview {
  transition: filter 0.15s ease;
  &:hover {
    filter: brightness(1.08);
  }
}
</style>
