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
  </div>
</template>

<script lang="ts">
import {
  CloseIcon,
  DesktopIcon,
  GlobeIcon,
  LoadingIcon,
  PointerIcon,
  SuccessIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent, type Component, type PropType } from 'vue';
import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import { isBrowserToolExecutionState, sanitizeBrowserOrigin } from '@/utils/browserToolExecution';

const STATE_ICONS: Record<IBrowserToolExecutionState, Component> = {
  choose_device: DesktopIcon,
  device_offline: WarningIcon,
  awaiting_device: GlobeIcon,
  awaiting_local_approval: TimeIcon,
  takeover_required: PointerIcon,
  executing: LoadingIcon,
  completed: SuccessIcon,
  denied: CloseIcon,
  expired: TimeIcon,
  cancel_too_late: WarningIcon
};

export default defineComponent({
  name: 'BrowserToolActivity',
  props: {
    item: {
      type: Object as PropType<IChatMessageContentItem>,
      required: true
    }
  },
  computed: {
    state(): IBrowserToolExecutionState {
      return isBrowserToolExecutionState(this.item.execution_state) ? this.item.execution_state : 'awaiting_device';
    },
    title(): string {
      return (
        this.item.tool_display_name ||
        this.item.tool_name?.replace(/_/g, ' ') ||
        (this.$t('chat.browserTool.title') as string)
      );
    },
    origin(): string | undefined {
      return sanitizeBrowserOrigin(this.item.origin);
    },
    icon(): Component {
      return STATE_ICONS[this.state];
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
