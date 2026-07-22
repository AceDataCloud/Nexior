<template>
  <div class="voice-option">
    <button
      v-if="option.audio"
      type="button"
      class="preview"
      :class="{ playing }"
      :aria-label="playing ? 'stop preview' : 'play preview'"
      @mousedown.prevent
      @click.stop.prevent="$emit('preview', option)"
    >
      <svg v-if="playing" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    </button>
    <span v-else class="preview placeholder" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"
          fill="currentColor"
        />
      </svg>
    </span>
    <div class="meta">
      <span class="label">{{ option.label }}</span>
      <span v-if="option.description" class="description">{{ option.description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FishVoiceOption',
  props: {
    option: {
      type: Object as () => { value: string; label: string; description?: string; audio?: string },
      required: true
    },
    playing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['preview']
});
</script>

<style lang="scss" scoped>
.voice-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
  max-width: 100%;

  .preview {
    flex: none;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    transition: background 0.15s ease;

    &:hover,
    &.playing {
      background: var(--el-color-primary-light-7);
    }
    &.placeholder {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
      cursor: default;
    }
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;

    .label {
      font-size: 13px;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .description {
      font-size: 11px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
