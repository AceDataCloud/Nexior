<template>
  <div
    class="flex song-item items-center w-full hover-bg-main"
    :class="{ playing: id === song.id }"
    @dblclick="play(song)"
  >
    <div class="flex-shrink-0 flex-1 flex items-center justify-between pr-5">
      <div class="cover-container">
        <el-image :src="song.image_url" class="cover-image" fit="cover">
          <template #placeholder>
            <div class="image-slot">Loading...</div>
          </template>
        </el-image>
        <div class="duration">{{ useFormatDuring(song?.duration) }}</div>
        <div v-if="id === song.id && isPlaying" class="play-overlay" @click="togglePlay">
          <el-icon><VideoPause /></el-icon>
        </div>
        <div v-else class="play-overlay" @click="play(song)">
          <el-icon><VideoPlay /></el-icon>
        </div>
      </div>

      <div class="content">
        <div class="song-info">
          <h2>{{ song?.title }}</h2>
          <p>{{ song?.style }}</p>
        </div>
        <div class="controls">
          <!-- <el-button type="primary" class="extend-btn">{{ extendButtonText }}</el-button> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormatDuring } from '@/utils/number';
import type { Song } from '@/models';
import { ElButton, ElImage, ElIcon } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import IconPark from '@/components/common/IconPark.vue';
import { ThumbsUp, More, ThumbsDown } from '@icon-park/vue-next';
const store = useStore();
defineProps<{
  // @ts-ignore
  song: Song;
}>();
const extendButtonText = ref('Extend');
const id = computed({
  get: () => store.state.suno.player.id,
  set: (value) => store.commit('suno/setId', value)
});
const isPlaying = computed({
  get: () => store.state.suno.player.isPlaying,
  set: (value) => store.commit('suno/setIsPlaying', value)
});
// 方法
const play = (song: Song) => store.dispatch('suno/play', song);
const togglePlay = () => store.dispatch('suno/togglePlay');
</script>

<style lang="scss" scoped>
.song-item {
  @apply py-2.5 pl-0.5;
  &:hover {
    .icon-action {
      @apply inline-block;
    }
  }
}

.playing {
  background: var(--el-bg-color-page);
  // @apply bg-[var(--el-bg-color-page)] dark:bg-[var(--el-bg-color-page)];
}

.cover-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin-right: 16px;
  flex-shrink: 0;
}

.cover-image {
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

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 4px;
}

.play-overlay:hover {
  opacity: 1;
}

.play-overlay .el-icon {
  font-size: 40px;
  color: white;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100px;
}

.song-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.song-info h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.song-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #aaa;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.extend-btn {
  background-color: #1db954;
  border-color: #1db954;
}

.extend-btn:hover {
  background-color: var(--el-color-primary);
  border-color: #1ed760;
}

.public-switch {
  --el-switch-on-color: #1db954;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

:deep(.el-button) {
  --el-button-bg-color: #333;
  --el-button-border-color: #333;
  --el-button-hover-bg-color: #444;
  --el-button-hover-border-color: #444;
}

:deep(.el-switch__core) {
  border-color: #555;
  background-color: #555;
}

:deep(.el-switch.is-checked .el-switch__core) {
  border-color: #1db954;
  background-color: #1db954;
}
</style>
