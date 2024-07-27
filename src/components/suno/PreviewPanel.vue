<template>
  <el-scrollbar class="right-panel">
    <div v-if="audio?.object" class="card">
      <div class="image-container">
        <el-image :src="audio.image_url" fit="cover">
          <template #error>
            <div class="image-slot">
              <el-icon><icon-picture /></el-icon>
            </div>
          </template>
        </el-image>
        <h2 class="title">{{ audio?.title }}</h2>
      </div>
      <div class="content">
        <div class="artist">
          <el-avatar :size="30" :src="audio?.image_url"></el-avatar>
          <span>{{ audio?.prompt }}</span>
        </div>
        <p class="style">{{ audio?.style }}</p>
        <p class="time">{{ $dayjs.format(audio?.created_at) }}</p>
        <div class="lyrics">
          <p>{{ audio?.lyric }}</p>
        </div>
      </div>
    </div>
    <div v-else class="gradient-background"></div>
  </el-scrollbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElScrollbar, ElAvatar, ElIcon } from 'element-plus';
import { Picture as IconPicture } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElScrollbar,
    IconPicture,
    ElImage,
    ElAvatar,
    ElIcon
  },
  data() {
    return {
      showCloseIcon: true
    };
  },
  computed: {
    audio() {
      return this.$store.state.suno?.audio;
    }
  },
  methods: {
    closeCard() {
      this.showCloseIcon = !this.showCloseIcon;
    }
  }
});
</script>

<style scoped>
.right-panel {
  padding: 2px;
  background-color: (--el-bg-color);
}

.cover-image {
  width: 100%;
  height: auto;
  margin-bottom: 10px;
}
.card-scrollbar {
  height: 600px;
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
  height: 300px;
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

.content {
  padding: 15px;
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

.artist {
  display: flex;
  align-items: center;
  margin: 10px 0;
  font-weight: bold;
}

.artist span {
  margin-right: 10px;
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

.time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lyrics {
  margin: 15px 0;
  font-size: 14px;
  line-height: 25px;
  white-space: pre-wrap;
}
</style>
