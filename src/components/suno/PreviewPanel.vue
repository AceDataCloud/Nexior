<template>
  <div v-if="audio?.object" class="size-full overflow-hidden">
    <div class="relative h-[300px]">
      <el-image :src="audio.image_url" fit="cover" class="size-full">
        <template #error>
          <div class="flex items-center justify-center size-full bg-[var(--el-bg-color)]">
            <el-icon class="text-3xl"><icon-picture /></el-icon>
          </div>
        </template>
      </el-image>
      <h2
        class="absolute bottom-0 left-0 right-0 m-0 p-4 text-white z-10 bg-gradient-to-t from-black/70 to-transparent"
      >
        {{ audio?.title }}
      </h2>
    </div>
    <div class="p-4">
      <div class="flex items-center font-bold mb-2">
        <el-avatar :size="30" :src="audio?.image_url" class="mr-2"></el-avatar>
        <span>{{ audio?.title }}</span>
      </div>
      <p class="text-[var(--el-text-color-regular)] mb-2">{{ audio?.style }}</p>
      <p class="text-xs text-[var(--el-text-color-regular)]">{{ $dayjs.format(audio?.created_at) }}</p>
      <div class="mt-4 text-sm leading-[25px] whitespace-pre-wrap">
        <p>{{ audio?.lyric }}</p>
      </div>
    </div>
  </div>
  <div v-else class="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElScrollbar, ElAvatar, ElIcon } from 'element-plus';
import { Picture as IconPicture } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    IconPicture,
    ElImage,
    ElAvatar,
    ElIcon
  },
  computed: {
    audio() {
      return this.$store.state.suno?.audio;
    }
  }
});
</script>
