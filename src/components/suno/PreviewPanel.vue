<template>
  <el-scrollbar class="card-scrollbar">
    <div v-if="song" class="card" @mouseenter="showCloseIcon = true" @mouseleave="showCloseIcon = false">
      <div class="image-container">
        <el-image :src="song.image_url" fit="cover">
          <template #error>
            <div class="image-slot">
              <el-icon><icon-picture /></el-icon>
            </div>
          </template>
        </el-image>
        <el-icon v-show="showCloseIcon" size="large" class="close-icon" @click="closeCard">
          <Close />
        </el-icon>
        <h2 class="title">{{ song.title }}</h2>
      </div>
      <div class="content">
        <p>{{ song.style }}</p>
        <div class="artist">
          <el-avatar :size="30" :src="song.image_url"></el-avatar>
          <span>{{ song.prompt }}</span>
        </div>
        <p>{{ $dayjs.format(song?.created_at) }}</p>
        <!-- <div class="actions">
          <el-icon class="action-icon"><Plus /></el-icon>
          <el-icon class="action-icon"><Minus /></el-icon>
          <el-icon class="action-icon"><Share /></el-icon>
        </div> -->
        <div class="lyrics">
          <p style="white-space: pre-wrap" v-html="song.lyric"></p>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { inject, Ref, ref } from 'vue';
import { ElAside, ElImage, ElScrollbar, ElAvatar, ElIcon } from 'element-plus';
import { Close, Picture as IconPicture, Plus, Minus, Share } from '@element-plus/icons-vue';
import { ElPopover } from 'element-plus';
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();
// 状态
const song = computed({
  get: () => store.state.suno.player.song,
  set: (value) => store.commit('suno/setSong', value)
});

const genre = ref('synth-driven pop');
const showCloseIcon = ref(false);
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
