<template>
  <div :class="['browser-tool-activity', `state-${state}`]" role="status" aria-live="polite">
    <div class="activity-icon" aria-hidden="true">
      <font-awesome-icon :icon="icon" :spin="state === 'executing'" />
    </div>
    <div class="activity-copy">
      <div class="activity-title">{{ title }}</div>
      <div class="activity-status">{{ $t(`chat.browserTool.state.${state}`) }}</div>
      <div v-if="origin" class="activity-origin">{{ origin }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IBrowserToolExecutionState, IChatMessageContentItem } from '@/models';
import { isBrowserToolExecutionState, sanitizeBrowserOrigin } from '@/utils/browserToolExecution';

const TERMINAL_STATES = new Set<IBrowserToolExecutionState>(['completed', 'denied', 'expired', 'cancel_too_late']);

export default defineComponent({
  name: 'BrowserToolActivity',
  components: { FontAwesomeIcon },
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
    icon(): string {
      if (this.state === 'completed') return 'fa-solid fa-check';
      if (this.state === 'denied' || this.state === 'expired') return 'fa-solid fa-xmark';
      if (this.state === 'executing') return 'fa-solid fa-spinner';
      if (TERMINAL_STATES.has(this.state)) return 'fa-solid fa-triangle-exclamation';
      return 'fa-solid fa-globe';
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
