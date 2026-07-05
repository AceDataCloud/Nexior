<template>
  <div class="progress-steps" aria-live="polite">
    <div
      v-for="(step, i) in steps"
      :key="step.key"
      class="step"
      :class="stateOf(i)"
      :aria-current="i === currentIndex ? 'step' : undefined"
    >
      <span class="ico">
        <el-icon v-if="i === currentIndex" class="is-loading" :aria-label="$t(`maestro.step.${step.key}`)">
          <loading />
        </el-icon>
        <el-icon v-else-if="i < currentIndex"><check /></el-icon>
      </span>
      <span class="txt">{{ $t(`maestro.step.${step.key}`) }}</span>
    </div>
    <p v-if="detail" class="detail">{{ detail }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElIcon } from 'element-plus';
import { Loading, Check } from '@element-plus/icons-vue';
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
  components: { ElIcon, Loading, Check },
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
  },
  methods: {
    stateOf(i: number): 'done' | 'active' | 'pending' {
      const cur = this.currentIndex;
      return i < cur ? 'done' : i === cur ? 'active' : 'pending';
    }
  }
});
</script>

<style lang="scss" scoped>
.progress-steps {
  margin: 4px 0 8px;

  // refined, connector-line-free checklist with small consistent indicators
  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 1.75;

    .ico {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    }

    &.done {
      color: var(--el-color-primary);
      .ico {
        color: var(--el-color-primary);
      }
    }
    &.active {
      color: var(--el-color-primary);
      font-weight: 600;
      .ico {
        color: var(--el-color-primary);
      }
    }
    &.pending {
      color: var(--el-text-color-disabled);
      .ico::before {
        content: '';
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        border: 1px solid var(--el-text-color-disabled);
      }
    }
  }

  .detail {
    margin: 3px 0 0 22px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-placeholder);
    word-break: break-word;
    overflow-wrap: anywhere;
  }
}
</style>
