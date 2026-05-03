<template>
  <div class="summary-chip">
    <span class="part" :title="$t('kling.name.model')">{{ modelLabel }}</span>
    <span class="dot">·</span>
    <span class="part" :title="$t('kling.name.duration')">{{ durationLabel }}</span>
    <span class="dot">·</span>
    <span class="part" :title="$t('kling.name.ratio')">{{ aspectRatio || '16:9' }}</span>
    <span class="dot">·</span>
    <span class="part" :title="$t('kling.name.mode')">{{ modeLabel }}</span>
    <span v-if="generateAudio" class="audio" :title="$t('kling.name.generateAudio')">
      <font-awesome-icon icon="fa-solid fa-headphones" />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const MODEL_LABELS: Record<string, string> = {
  'kling-v3': 'v3',
  'kling-v3-omni': 'v3-Omni',
  'kling-v2-6': 'v2.6',
  'kling-v2-5-turbo': 'v2.5-Turbo',
  'kling-v2-1-master': 'v2.1-Master',
  'kling-v2-master': 'v2-Master',
  'kling-v1-6': 'v1.6',
  'kling-v1': 'v1',
  'kling-video-o1': 'Video-o1'
};

const MODE_RESOLUTION: Record<string, string> = {
  std: '720p',
  pro: '1080p',
  '4k': '4K'
};

export default defineComponent({
  name: 'SummaryChip',
  components: {
    FontAwesomeIcon
  },
  computed: {
    config() {
      return this.$store.state.kling?.config || {};
    },
    modelLabel(): string {
      const id = this.config?.model || 'kling-v2-5-turbo';
      return MODEL_LABELS[id] || id;
    },
    durationLabel(): string {
      const d = this.config?.duration ?? 5;
      return `${d}s`;
    },
    aspectRatio(): string {
      return this.config?.aspect_ratio || '';
    },
    modeLabel(): string {
      const m = this.config?.mode || 'std';
      return MODE_RESOLUTION[m] || m;
    },
    generateAudio(): boolean {
      return Boolean(this.config?.generate_audio);
    }
  }
});
</script>

<style lang="scss" scoped>
.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  margin-bottom: 10px;
  border-radius: 999px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  user-select: none;

  .part {
    white-space: nowrap;
  }
  .dot {
    color: var(--el-text-color-disabled);
  }
  .audio {
    margin-left: 4px;
    color: var(--el-color-primary);
    font-size: 11px;
  }
}
</style>
