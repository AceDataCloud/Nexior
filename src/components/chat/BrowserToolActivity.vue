<template>
  <div
    :class="['browser-tool-activity', `state-${state}`, { 'is-error': item.is_error }]"
    role="status"
    aria-live="polite"
  >
    <div class="activity-header" @click="expanded = !expanded">
      <div class="activity-icon" aria-hidden="true">
        <component
          :is="icon"
          :class="{ 'is-spinning': state === 'executing' }"
          :size="'1em' as any"
          aria-hidden="true"
          focusable="false"
        />
      </div>
      <div class="activity-copy">
        <div class="activity-title">{{ title }}</div>
        <div class="activity-status">{{ $t(`chat.browserTool.state.${state}`) }}</div>
        <div v-if="origin" class="activity-origin">{{ origin }}</div>
      </div>
      <div class="activity-actions">
        <span v-if="item.duration_ms" class="activity-duration">{{ item.duration_ms }}ms</span>
        <el-button v-if="recoveryAction" text size="small" @click.stop="$emit('recovery', recoveryAction)">
          {{ $t(`chat.browserTool.recovery.${recoveryAction}`) }}
        </el-button>
        <el-button v-if="canStop" text size="small" @click.stop="$emit('stop-session', item.browser_session_id)">
          {{ $t('chat.browserTool.stop') }}
        </el-button>
        <el-icon class="activity-expand" :class="{ rotated: expanded }"
          ><ExpandRightIcon :size="'1em' as any" aria-hidden="true" focusable="false"
        /></el-icon>
      </div>
    </div>
    <div v-if="expanded" class="activity-body">
      <div v-if="inputText" class="activity-section">
        <div class="activity-section-label">Input</div>
        <pre class="activity-code">{{ inputText }}</pre>
      </div>
      <div v-if="item.output" class="activity-section">
        <div class="activity-section-label">Output</div>
        <pre class="activity-code">{{ item.output }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  CloseIcon,
  DesktopIcon,
  ExpandRightIcon,
  GlobeIcon,
  LoadingIcon,
  SuccessIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { ElButton, ElIcon } from 'element-plus';
import { defineComponent, type Component, type PropType } from 'vue';
import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import { isBrowserToolExecutionState, sanitizeBrowserOrigin } from '@/utils/browserToolExecution';

const STATE_ICONS: Record<IBrowserToolExecutionState, Component> = {
  starting_session: LoadingIcon,
  attaching_tab: GlobeIcon,
  ready: DesktopIcon,
  executing: LoadingIcon,
  completed: SuccessIcon,
  device_offline: WarningIcon,
  device_busy: WarningIcon,
  authorization_required: TimeIcon,
  stopped: CloseIcon,
  expired: TimeIcon,
  debugger_unavailable: WarningIcon,
  unknown_outcome: WarningIcon,
  failed: CloseIcon
};

const RECOVERY_ACTIONS = {
  device_offline: 'open-device-manager',
  device_busy: 'stop-other-session',
  debugger_unavailable: 'close-devtools',
  authorization_required: 'open-consent-card'
} as const;

export default defineComponent({
  name: 'BrowserToolActivity',
  components: { ElButton, ElIcon, ExpandRightIcon },
  props: {
    item: {
      type: Object as PropType<IChatMessageContentItem>,
      required: true
    }
  },
  emits: ['stop-session', 'recovery'],
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    state(): IBrowserToolExecutionState {
      return isBrowserToolExecutionState(this.item.execution_state) ? this.item.execution_state : 'starting_session';
    },
    title(): string {
      return (
        this.item.tool_display_name ||
        this.item.tool_name?.replace(/_/g, ' ') ||
        (this.$t('chat.browserTool.title') as string)
      );
    },
    origin(): string | undefined {
      const origin = sanitizeBrowserOrigin(this.item.origin);
      return origin ? new URL(origin).hostname : undefined;
    },
    icon(): Component {
      return STATE_ICONS[this.state];
    },
    recoveryAction(): (typeof RECOVERY_ACTIONS)[keyof typeof RECOVERY_ACTIONS] | undefined {
      return RECOVERY_ACTIONS[this.state as keyof typeof RECOVERY_ACTIONS];
    },
    canStop(): boolean {
      return (
        !!this.item.browser_session_id &&
        ['starting_session', 'attaching_tab', 'ready', 'executing'].includes(this.state)
      );
    },
    inputText(): string {
      const input = this.item.input;
      if (!input || Object.keys(input).length === 0) {
        // Args may still be streaming in; show the raw text so an expanded
        // running tool isn't an empty block.
        return this.item.input_stream || '';
      }
      return JSON.stringify(input, null, 2);
    }
  }
});
</script>

<style lang="scss" scoped>
.browser-tool-activity {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
  color: var(--el-text-color-primary);

  &.state-completed {
    border-color: var(--el-color-success-light-5);
  }

  &.state-denied,
  &.state-expired,
  &.state-failed,
  &.is-error {
    border-color: var(--el-color-danger-light-5);
  }
}

.activity-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-light);

  &:hover {
    background: var(--el-fill-color);
  }
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  color: var(--el-text-color-secondary);
}

.is-spinning {
  animation: browser-tool-spin 1s linear infinite;
}

@keyframes browser-tool-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-spinning {
    animation: none;
  }
}

.activity-copy {
  min-width: 0;
  flex: 1;
}

.activity-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.activity-duration {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.activity-expand {
  transition: transform 0.2s;
  color: var(--el-text-color-secondary);

  &.rotated {
    transform: rotate(90deg);
  }
}

.activity-body {
  padding: 0 12px 8px;
}

.activity-section {
  margin-top: 6px;
}

.activity-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.activity-code {
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

.activity-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.activity-status,
.activity-origin {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.activity-origin {
  overflow-wrap: anywhere;
}
</style>
