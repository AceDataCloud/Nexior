<template>
  <div class="scheduled-outcome" :class="[`status-${status}`, { compact }]" role="status">
    <div class="outcome-heading">
      <font-awesome-icon :icon="statusIcon" :spin="status === 'running'" class="outcome-icon" aria-hidden="true" />
      <span class="outcome-label">{{ $t(`chat.scheduledTasks.run.${status}`) }}</span>
    </div>
    <div v-if="reason" class="outcome-reason">{{ reason }}</div>
    <div v-if="$slots.default" class="outcome-actions"><slot /></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { ScheduledOutcomeStatus } from '@/operators/scheduledTasks';

const STATUS_ICONS: Record<ScheduledOutcomeStatus, string> = {
  queued: 'fa-solid fa-spinner',
  running: 'fa-solid fa-spinner',
  success: 'fa-solid fa-circle-check',
  failed: 'fa-solid fa-circle-exclamation',
  needs_user_input: 'fa-solid fa-triangle-exclamation',
  unknown: 'fa-solid fa-clock',
  unverified: 'fa-solid fa-circle-info'
};

export default defineComponent({
  name: 'ScheduledOutcomeStatus',
  components: { FontAwesomeIcon },
  props: {
    status: {
      type: String as PropType<ScheduledOutcomeStatus>,
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    statusIcon(): string {
      return STATUS_ICONS[this.status];
    }
  }
});
</script>

<style lang="scss" scoped>
.scheduled-outcome {
  --outcome-color: var(--el-text-color-secondary);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 4px 10px;
  min-width: 0;
  color: var(--outcome-color);
}
.outcome-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 650;
  white-space: nowrap;
}
.outcome-icon {
  width: 15px;
  flex: none;
}
.outcome-reason {
  min-width: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
  word-break: break-word;
}
.outcome-actions {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.compact {
  display: inline-flex;
  gap: 7px;
  max-width: 100%;
  font-size: 12px;
}
.compact .outcome-reason {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-success {
  --outcome-color: var(--el-color-success);
}
.status-failed {
  --outcome-color: var(--el-color-danger);
}
.status-needs_user_input {
  --outcome-color: var(--el-color-warning);
}
.status-unknown {
  --outcome-color: var(--el-color-primary);
}
.status-unverified,
.status-queued,
.status-running {
  --outcome-color: var(--el-text-color-secondary);
}
</style>
