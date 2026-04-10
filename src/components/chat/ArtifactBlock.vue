<template>
  <div class="artifact-block">
    <!-- Image -->
    <div v-if="artifact.type === 'image'" class="artifact-image">
      <el-image
        :src="artifact.url"
        :alt="artifact.name"
        fit="contain"
        style="max-width: 400px; max-height: 400px; border-radius: 8px"
        :preview-src-list="[artifact.url]"
      />
      <div class="artifact-name">{{ artifact.name }}</div>
    </div>

    <!-- Audio -->
    <div v-else-if="artifact.type === 'audio'" class="artifact-audio">
      <audio controls :src="artifact.url" style="width: 100%; max-width: 400px" />
      <div class="artifact-name">{{ artifact.name }}</div>
    </div>

    <!-- Video -->
    <div v-else-if="artifact.type === 'video'" class="artifact-video">
      <video controls :src="artifact.url" style="max-width: 500px; border-radius: 8px" />
      <div class="artifact-name">{{ artifact.name }}</div>
    </div>

    <!-- Generic file -->
    <div v-else class="artifact-file">
      <a :href="artifact.url" target="_blank" rel="noopener noreferrer" class="artifact-link">
        <el-icon><Document /></el-icon>
        <span>{{ artifact.name }}</span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Document } from '@element-plus/icons-vue';
import type { IChatArtifact } from '@/models';

export default defineComponent({
  name: 'ArtifactBlock',
  components: { Document },
  props: {
    artifact: {
      type: Object as PropType<IChatArtifact>,
      required: true
    }
  }
});
</script>

<style scoped>
.artifact-block {
  margin: 8px 0;
}
.artifact-name {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.artifact-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  text-decoration: none;
  color: #333;
}
.artifact-link:hover {
  background: #e8e8e8;
}
</style>
