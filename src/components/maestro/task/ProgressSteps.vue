<template>
  <div class="progress-steps" aria-live="polite">
    <div
      v-for="step in steps"
      :key="step.key"
      class="step"
      :class="step.state"
      :role="step.state === 'active' ? 'status' : undefined"
      :aria-current="step.state === 'active' ? 'step' : undefined"
    >
      <span class="marker">
        <font-awesome-icon v-if="step.state === 'done'" icon="fa-solid fa-circle-check" />
        <font-awesome-icon v-else-if="step.state === 'active'" icon="fa-solid fa-spinner" spin />
        <span v-else class="dot" />
      </span>
      <span class="label">{{ $t(`maestro.step.${step.key}`) }}</span>
      <span v-if="step.state === 'active' && detail" class="detail">{{ detail }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IMaestroTask } from '@/models';

// Canonical, ordered pipeline stages the backend emits (runner.py). The checklist mirrors them.
const CANON = ['plan', 'source', 'voice', 'compose', 'render', 'deliver'];

// Map a (possibly legacy/free-form) stage string to its canonical index; -1 = unrecognized.
function canonIndex(stage?: string): number {
  if (!stage) return -1;
  const s = stage.toLowerCase();
  const direct = CANON.indexOf(s);
  if (direct >= 0) return direct;
  if (/plan|storyboard|script|brief/.test(s)) return 0;
  if (/source|search|image|photo|asset|media/.test(s)) return 1;
  if (/voice|tts|audio|narrat/.test(s)) return 2;
  if (/compose|composit|build|layout|scene/.test(s)) return 3;
  if (/render|encode/.test(s)) return 4;
  if (/deliver|upload|cdn|complete|done|finish/.test(s)) return 5;
  return -1;
}

type StepState = 'done' | 'active' | 'pending';

export default defineComponent({
  name: 'ProgressSteps',
  components: { FontAwesomeIcon },
  props: {
    modelValue: {
      type: Object as () => IMaestroTask | undefined,
      required: true
    }
  },
  computed: {
    // The highest canonical stage reached so far. A running task is at least "planning" (index 0)
    // even before any progress event lands, so the checklist never renders fully empty.
    currentIndex(): number {
      const events = this.modelValue?.response?.data?.progress || [];
      let max = -1;
      for (const e of events) max = Math.max(max, canonIndex(e?.stage));
      max = Math.max(max, canonIndex(this.modelValue?.response?.data?.stage));
      return Math.max(max, 0);
    },
    // Latest progress message (may be from a previous step if the current step hasn't logged one
    // yet) — shown as the live "currently doing" detail under the active step.
    detail(): string | undefined {
      const events = this.modelValue?.response?.data?.progress || [];
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i]?.message) return events[i]?.message;
      }
      return undefined;
    },
    steps(): { key: string; state: StepState }[] {
      const cur = this.currentIndex;
      return CANON.map((key, i) => ({
        key,
        state: (i < cur ? 'done' : i === cur ? 'active' : 'pending') as StepState
      }));
    }
  }
});
</script>

<style lang="scss" scoped>
.progress-steps {
  margin: 6px 0 10px;
  .step {
    display: flex;
    align-items: center;
    font-size: 13px;
    line-height: 1.9;
    color: var(--el-text-color-secondary);
    min-width: 0;
    .marker {
      width: 18px;
      flex-shrink: 0;
      display: inline-flex;
      justify-content: center;
      margin-right: 8px;
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 1.5px solid var(--el-text-color-disabled);
      }
    }
    .label {
      flex-shrink: 0;
    }
    .detail {
      margin-left: 8px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &.done {
      color: var(--el-color-success);
    }
    &.active {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    &.pending {
      color: var(--el-text-color-disabled);
    }
  }
}
</style>
