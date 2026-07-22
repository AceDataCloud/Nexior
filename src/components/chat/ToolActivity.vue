<template>
  <div :class="['tool-activity', { 'is-error': isError, 'is-running': isRunning }]">
    <div class="tool-header" @click="expanded = !expanded">
      <span class="tool-icon">
        <el-icon v-if="isRunning" class="is-loading"
          ><Loading :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else-if="isError" color="var(--el-color-danger)"
          ><CircleCloseFilled :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else color="var(--el-color-success)"
          ><CircleCheckFilled :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
      </span>
      <span class="tool-name">{{ displayName }}</span>
      <span v-if="isInterrupted" class="tool-interrupted">{{ $t('chat.toolActivity.interrupted') }}</span>
      <span v-else-if="item.duration_ms" class="tool-duration">{{ item.duration_ms }}ms</span>
      <el-icon class="tool-expand" :class="{ rotated: expanded }"
        ><ArrowRight :size="'1em' as any" aria-hidden="true" focusable="false"
      /></el-icon>
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
import {
  LoadingIcon as Loading,
  SuccessIcon as CircleCheckFilled,
  ErrorIcon as CircleCloseFilled,
  ExpandRightIcon as ArrowRight
} from '@acedatacloud/core/icons/components';
import { defineComponent, PropType } from 'vue';
import { IChatMessageContentItem } from '@/models';

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
    },
    // False once the parent turn has finished/failed. A `running` block on an
    // ended turn never received a tool result (error mid-tool, or a legacy
    // orphan persisted before the backend finalized it), so we settle its icon
    // instead of spinning forever.
    turnActive: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    // Spin ONLY while the tool is genuinely in flight on a live turn.
    isRunning(): boolean {
      return this.item.status === 'running' && this.turnActive;
    },
    // A never-resolved block on an ended turn is shown as failed (honest —
    // we never observed a success), alongside blocks that errored explicitly.
    isError(): boolean {
      return !!this.item.is_error || (this.item.status === 'running' && !this.turnActive);
    },
    // Distinguish "the turn ended before this tool reported" from a normal
    // error, so we can show a short hint instead of a stale duration.
    isInterrupted(): boolean {
      return this.item.status === 'running' && !this.turnActive;
    },
    displayName(): string {
      if (this.item.tool_display_name) return this.item.tool_display_name;
      const name = this.item.tool_name || '';
      return TOOL_LABELS[name] || name.replace(/_/g, ' ');
    },
    inputText(): string {
      const input = this.item.input;
      const hasInput = input && Object.keys(input).length > 0;
      if (!hasInput) {
        // Still being written: show the raw arguments text streaming in
        // (input_stream) so a running tool isn't an empty block.
        return this.item.input_stream || '';
      }
      if (this.item.tool_name === 'code_execute') {
        return (input.code as string) || '';
      }
      if (this.item.tool_name === 'web_search') {
        return (input.query as string) || '';
      }
      return JSON.stringify(input, null, 2);
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

.tool-interrupted {
  color: var(--el-color-danger);
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
