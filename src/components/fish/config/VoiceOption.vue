<template>
  <div class="voice-option">
    <button
      v-if="option.audio"
      type="button"
      class="preview"
      :class="{ playing, loading }"
      :aria-label="playing ? 'stop preview' : 'play preview'"
      @mousedown.prevent
      @click.stop.prevent="$emit('preview', option)"
    >
      <svg v-if="loading" class="spin" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="42 60"
        />
      </svg>
      <svg v-else-if="playing" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
        <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
    </button>
    <span v-else class="preview placeholder" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="13" height="13">
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
    },
    loading: {
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
  width: 100%;
  min-width: 0;

  .preview {
    flex: none;
    width: 28px;
    height: 28px;
    padding: 0;
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
    &.playing,
    &.loading {
      background: var(--el-color-primary-light-7);
    }
    &.placeholder {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
      cursor: default;
    }
    .spin {
      animation: fish-voice-spin 0.8s linear infinite;
    }
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.35;
    padding: 2px 0;

    .label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .description {
      margin-top: 1px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

@keyframes fish-voice-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
