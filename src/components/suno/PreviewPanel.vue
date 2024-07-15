<template>
  <!-- <el-aside width="20%" class="right-panel">
    <div v-if="selectedSong">
      <el-image :src="selectedSong.coverImage" fit="cover" class="cover-image"></el-image>
      <div>{{ selectedSong.title }}</div>
      <div>{{ selectedSong.artist }}</div>
      <div>{{ selectedSong.genre }}</div>
      <div>{{ selectedSong.releaseDate }}</div>
      <div>{{ selectedSong.description }}</div>
    </div>
  </el-aside> -->
  <el-scrollbar class="card-scrollbar">
    <div v-if="selectedSong" class="card" @mouseenter="showCloseIcon = true" @mouseleave="showCloseIcon = false">
      <div class="image-container">
        <el-image :src="selectedSong.coverImage" fit="cover">
          <template #error>
            <div class="image-slot">
              <el-icon><icon-picture /></el-icon>
            </div>
          </template>
        </el-image>
        <el-icon v-show="showCloseIcon" size="large" class="close-icon" @click="closeCard">
          <Close />
        </el-icon>
        <h2 class="title">{{ selectedSong.title }}</h2>
      </div>
      <div class="content">
        <p>{{ genre }}</p>
        <div class="artist">
          <el-avatar :size="30" :src="selectedSong.coverImage"></el-avatar>
          <span>IrreverentSoundDesign5...</span>
        </div>
        <p>2024年7月12日 22:00</p>
        <div class="actions">
          <el-icon class="action-icon"><Plus /></el-icon>
          <el-icon class="action-icon"><Minus /></el-icon>
          <el-icon class="action-icon"><Share /></el-icon>
        </div>
        <div class="lyrics">
          <p v-for="(line, index) in lyrics" :key="index">{{ line }}</p>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { inject, Ref, ref } from 'vue';
import { ElAside, ElImage, ElScrollbar, ElAvatar, ElIcon } from 'element-plus';
import { Close, Picture as IconPicture, Plus, Minus, Share } from '@element-plus/icons-vue';
interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  releaseDate: string;
  description: string;
  coverImage: string;
  audioSrc: string;
  duration: string;
}

const selectedSong = {
  id: 1,
  title: '依戀',
  artist: 'DiverseTones341',
  genre: 'pop, 感性, 輕柔',
  releaseDate: '2024年7月7日 15:09',
  description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
  coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
  audioSrc: 'https://cdn.huyinfu.space/test.mp3',
  duration: '3:45'
};
const showCloseIcon = ref(false);
const lyrics = ref([
  '[Verse]',
  'Saw her in the crowd one night',
  'Shining like a city light',
  "Heartbeat racing can't slow down",
  'Lost in you but never found',
  '[Verse]',
  'Saw her in the crowd one night',
  'Shining like a city light'
]);
const genre = ref('synth-driven pop');
const closeCard = () => {
  console.log('Card closed');
};
</script>

<style scoped>
.right-panel {
  padding: 20px;
  background-color: #1e1e1e;
  color: #fff;
}

.cover-image {
  width: 100%;
  height: auto;
  margin-bottom: 10px;
}
.card-scrollbar {
  height: 600px; /* 增加高度以适应更大的图片 */
  width: 300px;
}

.card {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-container {
  position: relative;
  height: 300px; /* 增加图片容器的高度 */
}

.image-container .el-image {
  width: 100%;
  height: 100%;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 5px;
  color: white;
  z-index: 2;
}

.title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 15px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  color: white;
  z-index: 1;
}

.content {
  padding: 15px;
}

.artist {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.artist span {
  margin-left: 10px;
}

.actions {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}

.action-icon {
  font-size: 24px;
  cursor: pointer;
}

.lyrics {
  margin: 15px 0;
}
</style>
