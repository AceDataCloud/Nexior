<template>
  <div :class="['tool-activity', { 'is-error': item.is_error, 'is-running': item.status === 'running' }]">
    <div class="tool-header" @click="expanded = !expanded">
      <span class="tool-icon">
        <el-icon v-if="item.status === 'running'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else-if="item.is_error" color="var(--el-color-danger)"><CircleCloseFilled /></el-icon>
        <el-icon v-else color="var(--el-color-success)"><CircleCheckFilled /></el-icon>
      </span>
      <span class="tool-name">{{ displayName }}</span>
      <span v-if="item.duration_ms" class="tool-duration">{{ item.duration_ms }}ms</span>
      <el-icon class="tool-expand" :class="{ rotated: expanded }"><ArrowRight /></el-icon>
    </div>
    <div v-if="expanded" class="tool-body">
      <div v-if="inputText" class="tool-section">
        <div class="tool-section-label">Input</div>
        <pre class="tool-code">{{ inputText }}</pre>
      </div>
      <div v-if="item.output" class="tool-section">
        <div class="tool-section-label">Output</div>
        <pre class="tool-code">{{ item.output }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { IChatMessageContentItem } from '@/models';
import { Loading, CircleCheckFilled, CircleCloseFilled, ArrowRight } from '@element-plus/icons-vue';

const TOOL_LABELS: Record<string, string> = {
  code_execute: 'Running code',
  web_search: 'Searching the web',
  image_generate: 'Generating image',
  video_generate: 'Generating video',
  music_generate: 'Generating music'
};

export default defineComponent({
  name: 'ToolActivity',
  components: { Loading, CircleCheckFilled, CircleCloseFilled, ArrowRight },
  props: {
    item: {
      type: Object as PropType<IChatMessageContentItem>,
      required: true
    }
  },
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    displayName(): string {
      if (this.item.tool_display_name) return this.item.tool_display_name;
      const name = this.item.tool_name || '';
      return TOOL_LABELS[name] || name.replace(/_/g, ' ');
    },
    inputText(): string {
      if (!this.item.input) return '';
      if (this.item.tool_name === 'code_execute') {
        return (this.item.input.code as string) || '';
      }
      if (this.item.tool_name === 'web_search') {
        return (this.item.input.query as string) || '';
      }
      return JSON.stringify(this.item.input, null, 2);
    }
  }
});
</script>

<style lang="scss" scoped>
.tool-activity {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;

  &.is-error {
    border-color: var(--el-color-danger-light-5);
  }

  &.is-running {
    border-color: var(--el-color-primary-light-5);
  }
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-light);

  &:hover {
    background: var(--el-fill-color);
  }
}

.tool-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.tool-name {
  flex: 1;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tool-duration {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tool-expand {
  transition: transform 0.2s;
  color: var(--el-text-color-secondary);

  &.rotated {
    transform: rotate(90deg);
  }
}

.tool-body {
  padding: 0 12px 8px;
}

.tool-section {
  margin-top: 6px;
}

.tool-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.tool-code {
  background: var(--el-fill-color-darker);
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}
</style>
