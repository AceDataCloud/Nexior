<template>
  <div class="progress-steps" aria-live="polite">
    <el-steps direction="vertical" :active="currentIndex" finish-status="finish" :space="34">
      <el-step v-for="(step, i) in steps" :key="step.key" :title="$t(`maestro.step.${step.key}`)">
        <template v-if="i === currentIndex" #icon>
          <el-icon class="is-loading" :aria-label="$t(`maestro.step.${step.key}`)"><loading /></el-icon>
        </template>
      </el-step>
    </el-steps>
    <p v-if="detail" class="detail">{{ detail }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSteps, ElStep, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
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

export default defineComponent({
  name: 'ProgressSteps',
  components: { ElSteps, ElStep, ElIcon, Loading },
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
    steps(): { key: string }[] {
      return CANON.map((key) => ({ key }));
    }
  }
});
</script>

<style lang="scss" scoped>
.progress-steps {
  margin: 4px 0 10px;

  // compact, on-brand overrides for the native vertical stepper
  :deep(.el-step__icon) {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
  // thinner ring on the numbered / check circles
  :deep(.el-step__icon.is-text) {
    border-width: 1px;
  }
  // the active step is a clean spinning ring (no boxy border), brand-colored
  :deep(.el-step__icon.is-icon) {
    border: none;
    color: var(--el-color-primary);
    font-size: 16px;
  }
  :deep(.el-step__title) {
    font-size: 13px;
    line-height: 22px;
    padding-bottom: 4px;
    &.is-finish {
      color: var(--el-color-primary);
    }
    &.is-process {
      font-weight: 600;
      color: var(--el-color-primary);
    }
    &.is-wait {
      color: var(--el-text-color-disabled);
    }
  }

  .detail {
    margin: 2px 0 0 30px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-placeholder);
    word-break: break-word;
    overflow-wrap: anywhere;
  }
}
</style>
