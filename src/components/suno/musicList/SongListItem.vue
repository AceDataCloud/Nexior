<template>
  <div
    class="flex song-item items-center w-full hover-bg-main"
    :class="{ playing: id === song.id }"
    @dblclick="play(song)"
  >
    <div class="song-player">
      <!-- 歌曲封面 -->
      <div class="cover-container">
        <el-image :src="song.image_url" class="cover-image" fit="cover">
          <template #placeholder>
            <div class="image-slot">Loading...</div>
          </template>
        </el-image>
        <div class="duration">{{ useFormatDuring(song.duration) }}</div>
        <div v-if="id === song.id" class="play-overlay">
          <el-icon><VideoPause /></el-icon>
        </div>
        <div v-else class="play-overlay">
          <el-icon><VideoPlay /></el-icon>
        </div>
      </div>
      <!-- 歌曲详情信息 -->
      <div class="content">
        <div class="song-info">
          <h2>{{ song.title }}</h2>
          <p>{{ song.style }}</p>
        </div>
        <div class="controls">
          <el-button type="primary" class="extend-btn">{{ extendButtonText }}</el-button>
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
// 方法
const play = (song: Song) => store.dispatch('suno/play', song);
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
  @apply bg-blue-800 dark:bg-stone-800;
}
.song-player {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--el-color-primary);
  color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
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
  background-color: #1ed760;
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
