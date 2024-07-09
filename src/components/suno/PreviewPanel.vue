<template>
  <el-aside width="20%" class="right-panel">
    <div v-if="selectedSong">
      <el-image :src="selectedSong.coverImage" fit="cover" class="cover-image"></el-image>
      <div>{{ selectedSong.title }}</div>
      <div>{{ selectedSong.artist }}</div>
      <div>{{ selectedSong.genre }}</div>
      <div>{{ selectedSong.releaseDate }}</div>
      <div>{{ selectedSong.description }}</div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { inject, Ref } from 'vue';

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

const selectedSong = inject<Ref<Song | null>>('selectedSong');
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
</style>
