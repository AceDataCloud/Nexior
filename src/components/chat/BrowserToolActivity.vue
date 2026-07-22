<template>
  <div :class="['browser-tool-activity', `state-${state}`]" role="status" aria-live="polite">
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
      <el-button v-if="recoveryAction" text size="small" @click="$emit('recovery', recoveryAction)">
        {{ $t(`chat.browserTool.recovery.${recoveryAction}`) }}
      </el-button>
      <el-button v-if="canStop" text size="small" @click="$emit('stop-session', item.browser_session_id)">
        {{ $t('chat.browserTool.stop') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  CloseIcon,
  DesktopIcon,
  GlobeIcon,
  LoadingIcon,
  SuccessIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { ElButton } from 'element-plus';
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
  components: { ElButton },
  props: {
    item: {
      type: Object as PropType<IChatMessageContentItem>,
      required: true
    }
  },
  emits: ['stop-session', 'recovery'],
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
    }
  }
});
</script>

<style lang="scss" scoped>
.browser-tool-activity {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 8px 0;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);

  &.state-completed {
    border-color: var(--el-color-success-light-5);
  }

  &.state-denied,
  &.state-expired {
    border-color: var(--el-color-danger-light-5);
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
  justify-content: flex-end;
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
