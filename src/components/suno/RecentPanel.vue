<template>
  <el-container class="middle-panel">
    <el-main>
      <el-scrollbar class="music-list">
        <el-card
          v-for="song in songs"
          :key="song.id"
          class="song-item"
          :class="{ 'is-selected': selectedSong && selectedSong.id === song.id }"
          @click="selectSong(song)"
        >
          <div class="song-content">
            <el-image :src="song.coverImage" fit="cover" class="song-cover"></el-image>
            <div class="song-duration">{{ song.duration }}</div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist }}</div>
            </div>
            <div class="song-actions">
              <el-button icon="el-icon-thumb" circle @click.stop="likeSong(song)"></el-button>
              <el-button icon="el-icon-thumb-down" circle @click.stop="dislikeSong(song)"></el-button>
              <el-button icon="el-icon-share" circle @click.stop="shareSong(song)"></el-button>
              <el-button icon="el-icon-more" circle @click.stop="moreOptions(song)"></el-button>
            </div>
          </div>
        </el-card>
      </el-scrollbar>
    </el-main>
    <el-footer v-if="selectedSong" class="music-player">
      <audio ref="audio" controls>
        <source :src="selectedSong.audioSrc" type="audio/mp3" />
      </audio>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject, type Ref } from 'vue';
import { ElMessage } from 'element-plus';

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

const songs = ref<Song[]>([
  {
    id: 1,
    title: '依戀',
    artist: 'DiverseTones341',
    genre: 'pop, 感性, 輕柔',
    releaseDate: '2024年7月7日 15:09',
    description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
    coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
    audioSrc: 'https://cdn.huyinfu.space/test.mp3'
  },
  {
    id: 2,
    title: '我走后',
    artist: 'DiverseTones341',
    genre: 'pop, 感性, 輕柔',
    releaseDate: '2024年7月7日 15:09',
    description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
    coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
    audioSrc: 'https://cdn.huyinfu.space/wozouhou.mp3'
  },
  {
    id: 3,
    title: '献天缘',
    artist: 'DiverseTones341',
    genre: 'pop, 感性, 輕柔',
    releaseDate: '2024年7月7日 15:09',
    description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
    coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
    audioSrc: 'https://cdn.huyinfu.space/xiantianyuan.mp3'
  },
  {
    id: 4,
    title: '依戀',
    artist: 'DiverseTones341',
    genre: 'pop, 感性, 輕柔',
    releaseDate: '2024年7月7日 15:09',
    description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
    coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
    audioSrc: 'https://cdn.huyinfu.space/test.mp3'
  },
  {
    id: 5,
    title: '依戀',
    artist: 'DiverseTones341',
    genre: 'pop, 感性, 輕柔',
    releaseDate: '2024年7月7日 15:09',
    description: '街角的咖啡店\n你的笑容閃現\n心裡那抹一瞬間\n語言千言',
    coverImage: 'https://cdn.huyinfu.space/j0isyu.jpg',
    audioSrc: 'https://cdn.huyinfu.space/test.mp3'
  }
  // 更多歌曲数据
]);

const selectedSong = inject<Ref<Song | null>>('selectedSong', ref(null));
const setSelectedSong = inject<(song: Song | null) => void>('setSelectedSong');

const selectSong = (song: Song): void => {
  if (setSelectedSong) {
    setSelectedSong(song);
  }
};

const likeSong = (song: Song): void => {
  ElMessage.success(`Liked ${song.title}`);
};

const dislikeSong = (song: Song): void => {
  ElMessage.success(`Disliked ${song.title}`);
};

const shareSong = (song: Song): void => {
  ElMessage.success(`Shared ${song.title}`);
};

const moreOptions = (song: Song): void => {
  ElMessage.success(`More options for ${song.title}`);
};

watch(selectedSong, (newSong) => {
  if (newSong && newSong.audioSrc) {
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.load();
      audioElement.play();
    }
  }
});

onMounted(() => {
  if (songs.value.length > 0 && setSelectedSong) {
    setSelectedSong(songs.value[0]);
  }
});
</script>

<style scoped>
.middle-panel {
  width: 60%;
  background-color: #2b2b2b;
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
}

.music-list {
  overflow-y: auto;
  flex: 1;
}

.music-player {
  background-color: #333;
  padding: 10px;
  border-top: 1px solid #444;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  margin-bottom: 10px;
  background-color: #444;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.song-item:hover {
  background-color: #555;
}

.song-item.is-selected {
  border: 2px solid #409eff;
}

.song-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.song-cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  position: relative;
}

.song-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
}

.song-info {
  flex: 1;
  margin-left: 15px;
  display: flex;
  flex-direction: column;
}

.song-title {
  font-size: 16px;
  font-weight: bold;
}

.song-artist {
  font-size: 14px;
  color: #bbb;
}

.song-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
</style>
