<template>
  <div :class="['tool-activity', { 'is-error': item.is_error, 'is-running': item.status === 'running' }]">
    <button type="button" class="tool-header" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="tool-icon">
        <el-icon v-if="isPlan && allPlanCompleted" color="var(--el-color-success)"
          ><CircleCheckFilled :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else-if="isPlan && !planTodos.length" class="is-loading"
          ><Loading :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else-if="isPlan" color="var(--el-color-primary)"
          ><WriteIcon :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else-if="item.status === 'running'" class="is-loading"
          ><Loading :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else-if="item.is_error" color="var(--el-color-danger)"
          ><CircleCloseFilled :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
        <el-icon v-else color="var(--el-color-success)"
          ><CircleCheckFilled :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
      </span>
      <span class="tool-name">{{ isPlan ? $t('chat.plan.title') : displayName }}</span>
      <span v-if="isPlan && planTodos.length" class="plan-progress">{{ planProgress }}</span>
      <span v-else-if="item.duration_ms" class="tool-duration">{{ item.duration_ms }}ms</span>
      <el-icon class="tool-expand" :class="{ rotated: expanded }"
        ><ArrowRight :size="'1em' as any" aria-hidden="true" focusable="false"
      /></el-icon>
    </button>
    <div v-if="expanded && (!isPlan || planTodos.length)" class="tool-body" :class="{ 'plan-body': isPlan }">
      <ul v-if="isPlan" class="plan-list">
        <li v-for="(todo, index) in planTodos" :key="index" class="plan-item" :class="`is-${todo.status}`">
          <el-icon v-if="todo.status === 'completed'" class="plan-status-icon" color="var(--el-color-success)"
            ><CircleCheckFilled :size="'1em' as any" aria-hidden="true" focusable="false"
          /></el-icon>
          <el-icon v-else-if="todo.status === 'in_progress'" class="plan-status-icon is-loading"
            ><Loading :size="'1em' as any" aria-hidden="true" focusable="false"
          /></el-icon>
          <span v-else class="plan-pending-icon" aria-hidden="true"></span>
          <span class="sr-only">{{ $t(`codingBridge.transcript.todo${statusSuffix[todo.status]}`) }}: </span>
          <span class="plan-item-text">{{ todo.status === 'in_progress' ? todo.activeForm : todo.content }}</span>
        </li>
      </ul>
      <template v-else>
        <div v-if="inputText" class="tool-section">
          <div class="tool-section-label">Input</div>
          <pre class="tool-code">{{ inputText }}</pre>
        </div>
        <div v-if="item.output" class="tool-section">
          <div class="tool-section-label">Output</div>
          <pre class="tool-code">{{ item.output }}</pre>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  LoadingIcon as Loading,
  SuccessIcon as CircleCheckFilled,
  ErrorIcon as CircleCloseFilled,
  ExpandRightIcon as ArrowRight,
  WriteIcon
} from '@acedatacloud/core/icons/components';
import { ElIcon } from 'element-plus';
import { defineComponent, PropType } from 'vue';
import { IChatMessageContentItem } from '@/models';

const TOOL_LABELS: Record<string, string> = {
  code_execute: 'Running code',
  web_search: 'Searching the web',
  image_generate: 'Generating image',
  video_generate: 'Generating video',
  music_generate: 'Generating music'
};

type PlanStatus = 'pending' | 'in_progress' | 'completed';
type PlanTodo = { content: string; activeForm: string; status: PlanStatus };
const statusSuffix: Record<PlanStatus, string> = {
  pending: 'Pending',
  in_progress: 'InProgress',
  completed: 'Completed'
};

export default defineComponent({
  name: 'ToolActivity',
  components: { Loading, CircleCheckFilled, CircleCloseFilled, ArrowRight, WriteIcon, ElIcon },
  props: {
    item: {
      type: Object as PropType<IChatMessageContentItem>,
      required: true
    }
  },
  data() {
    return {
      expanded: this.item.tool_name === 'manage_todos',
      statusSuffix
    };
  },
  computed: {
    planTodos(): PlanTodo[] {
      if (this.item.tool_name !== 'manage_todos' || this.item.is_error) return [];
      const todos = this.item.input?.todos;
      if (!Array.isArray(todos) || todos.length === 0) return [];
      const valid = todos.every(
        (todo) =>
          todo &&
          typeof todo === 'object' &&
          typeof todo.content === 'string' &&
          todo.content.trim() &&
          (todo.status === 'pending' || todo.status === 'in_progress' || todo.status === 'completed')
      );
      if (!valid) return [];
      return todos.map((todo) => ({
        content: todo.content,
        activeForm: typeof todo.activeForm === 'string' && todo.activeForm.trim() ? todo.activeForm : todo.content,
        status: todo.status
      }));
    },
    isPlan(): boolean {
      return (
        this.item.tool_name === 'manage_todos' &&
        !this.item.is_error &&
        (this.planTodos.length > 0 || this.item.status === 'running')
      );
    },
    allPlanCompleted(): boolean {
      return this.isPlan && this.planTodos.every((todo) => todo.status === 'completed');
    },
    planProgress(): string {
      const done = this.planTodos.filter((todo) => todo.status === 'completed').length;
      return this.$t('codingBridge.transcript.todoProgress', { done, total: this.planTodos.length }) as string;
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
  },
  watch: {
    'item.tool_name'(name: string | undefined) {
      if (name === 'manage_todos') this.expanded = true;
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
  width: 100%;
  border: 0;
  padding: 8px 12px;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-light);

  &:hover {
    background: var(--el-fill-color);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
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

.plan-progress {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
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

.plan-body {
  padding: 2px 12px 10px;
}

.plan-list {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.plan-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.plan-status-icon,
.plan-pending-icon {
  flex: none;
  margin-top: 3px;
  font-size: 14px;
}

.plan-item.is-in_progress .plan-status-icon {
  color: var(--el-color-primary);
}

.plan-pending-icon {
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--el-border-color-darker);
  border-radius: 50%;
}

.plan-item-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.plan-item.is-completed .plan-item-text {
  color: var(--el-text-color-secondary);
  text-decoration: line-through;
  text-decoration-color: var(--el-text-color-placeholder);
}

.plan-item.is-in_progress .plan-item-text {
  font-weight: 500;
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
