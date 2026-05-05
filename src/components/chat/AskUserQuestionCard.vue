<template>
  <div class="ask-user-question-card" :class="{ 'is-collapsed': collapsed }">
    <!-- Collapsed view: one-line summary per question after submit / restore -->
    <div v-if="collapsed" class="collapsed">
      <div v-for="(q, idx) in questions" :key="idx" class="collapsed-row">
        <span class="check">✓</span>
        <span class="collapsed-q">{{ q.question }}</span>
        <span class="collapsed-arrow">→</span>
        <span class="collapsed-a">{{ collapsedAnswerFor(q) }}</span>
      </div>
      <div v-if="collapsedOther" class="collapsed-row collapsed-other">
        <span class="check">✓</span>
        <span class="collapsed-a">{{ collapsedOther }}</span>
      </div>
    </div>
    <!-- Interactive view: render each question with its options -->
    <div v-else class="card-body">
      <div v-for="(q, qIdx) in questions" :key="qIdx" class="question">
        <div class="question-head">
          <span class="chip">{{ headerFor(q) }}</span>
          <span v-if="q.multiSelect" class="multi-hint">{{ $t('chat.askUserQuestion.multiSelectHint') }}</span>
        </div>
        <div class="question-text">{{ q.question }}</div>
        <!-- Single-select options -->
        <el-radio-group
          v-if="!q.multiSelect"
          v-model="singleAnswers[qIdx] as string"
          class="options"
          @change="onAnswerChange"
        >
          <el-radio v-for="(opt, oIdx) in q.options" :key="oIdx" :value="opt.label" class="option">
            <span class="option-label">{{ opt.label }}</span>
            <span v-if="opt.description" class="option-desc">{{ opt.description }}</span>
          </el-radio>
        </el-radio-group>
        <!-- Multi-select options -->
        <el-checkbox-group v-else v-model="multiAnswers[qIdx] as string[]" class="options" @change="onAnswerChange">
          <el-checkbox v-for="(opt, oIdx) in q.options" :key="oIdx" :value="opt.label" class="option">
            <span class="option-label">{{ opt.label }}</span>
            <span v-if="opt.description" class="option-desc">{{ opt.description }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <!-- Free-text Other (per card) -->
      <div class="other">
        <div class="other-label">{{ $t('chat.askUserQuestion.other') }}</div>
        <el-input
          v-model="otherText"
          type="textarea"
          :rows="2"
          :placeholder="$t('chat.askUserQuestion.placeholder')"
          @input="onAnswerChange"
        />
      </div>
      <div class="actions">
        <el-button class="btn-skip" round @click="onSkip">{{ $t('chat.askUserQuestion.skip') }}</el-button>
        <el-button class="btn-submit" type="primary" round :disabled="!canSubmit" @click="onSubmit">
          {{ $t('chat.askUserQuestion.submit') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton, ElCheckbox, ElCheckboxGroup, ElInput, ElRadio, ElRadioGroup } from 'element-plus';
import { IAskUserQuestion, IAskUserQuestionPayload } from '@/models';
import { buildAskUserQuestionOutput, canSubmitAskUserQuestion, truncateHeader } from './askUserQuestion';

interface IData {
  // Per-question single-select answers (label string).
  singleAnswers: Record<number, string>;
  // Per-question multi-select answers (array of label strings).
  multiAnswers: Record<number, string[]>;
  // Free-text Other input (single, per card).
  otherText: string;
  collapsedAnswers: Record<number, string | string[]> | null;
  collapsedOther: string;
}

export default defineComponent({
  name: 'AskUserQuestionCard',
  components: {
    ElButton,
    ElInput,
    ElRadio,
    ElRadioGroup,
    ElCheckbox,
    ElCheckboxGroup
  },
  props: {
    /** Tool-use block id; sent back as `tool_use_id` on resume. */
    toolUseId: {
      type: String,
      required: true
    },
    payload: {
      type: Object as PropType<IAskUserQuestionPayload>,
      required: true
    },
    /**
     * When `true`, render the read-only collapsed summary.
     * `previousOutput` (the JSON string the user submitted previously)
     * MUST be provided so the card can show what was answered.
     */
    collapsed: {
      type: Boolean,
      default: false
    },
    previousOutput: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'skip'],
  data(): IData {
    return {
      singleAnswers: {},
      multiAnswers: {},
      otherText: '',
      collapsedAnswers: null,
      collapsedOther: ''
    };
  },
  computed: {
    questions(): IAskUserQuestion[] {
      return this.payload?.questions ?? [];
    },
    canSubmit(): boolean {
      return canSubmitAskUserQuestion(this.singleAnswers, this.multiAnswers, this.otherText);
    }
  },
  watch: {
    collapsed: {
      immediate: true,
      handler(val: boolean) {
        if (val) this.parsePreviousOutput();
      }
    },
    previousOutput: {
      immediate: false,
      handler() {
        if (this.collapsed) this.parsePreviousOutput();
      }
    }
  },
  methods: {
    headerFor(q: IAskUserQuestion): string {
      return truncateHeader(q.header);
    },
    onAnswerChange() {
      // Hook for v-model side effects (kept simple — `canSubmit` recomputes).
    },
    onSubmit() {
      const output = buildAskUserQuestionOutput(this.questions, this.singleAnswers, this.multiAnswers, this.otherText);
      this.$emit('submit', { tool_use_id: this.toolUseId, output });
    },
    onSkip() {
      this.$emit('skip', { tool_use_id: this.toolUseId });
    },
    parsePreviousOutput() {
      this.collapsedAnswers = null;
      this.collapsedOther = '';
      if (!this.previousOutput) return;
      try {
        const parsed = JSON.parse(this.previousOutput);
        if (parsed && typeof parsed === 'object') {
          const ans = (parsed as { answers?: Record<string, string | string[]> }).answers;
          if (ans && typeof ans === 'object') {
            const byIndex: Record<number, string | string[]> = {};
            this.questions.forEach((q, idx) => {
              if (q.question in ans) byIndex[idx] = ans[q.question];
            });
            this.collapsedAnswers = byIndex;
          }
          const other = (parsed as { other?: string | null }).other;
          if (typeof other === 'string') this.collapsedOther = other;
        }
      } catch {
        // Output isn't valid JSON — fall back to showing the raw string under
        // the first question.
        this.collapsedOther = this.previousOutput;
      }
    },
    collapsedAnswerFor(q: IAskUserQuestion): string {
      if (!this.collapsedAnswers) return '';
      const idx = this.questions.indexOf(q);
      const v = this.collapsedAnswers[idx];
      if (!v) return this.$t('chat.askUserQuestion.collapsedAnswerLabel');
      return Array.isArray(v) ? v.join(', ') : v;
    }
  }
});
</script>

<style lang="scss" scoped>
.ask-user-question-card {
  margin: 8px 0;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  padding: 12px 14px;
  font-size: 14px;
  max-width: 100%;
}

.ask-user-question-card.is-collapsed {
  background: var(--el-fill-color-light);
  padding: 8px 12px;
  font-size: 13px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.question {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.question-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.multi-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.question-text {
  color: var(--el-text-color-primary);
  font-weight: 500;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  // Element Plus radios/checkboxes default to inline rows; stack here.
  :deep(.el-radio),
  :deep(.el-checkbox) {
    margin-right: 0;
    height: auto;
    padding: 6px 8px;
    border-radius: 8px;
    align-items: flex-start;
    white-space: normal;
    width: 100%;
    box-sizing: border-box;
    &:hover {
      background: var(--el-fill-color-light);
    }
  }
  :deep(.el-radio__label),
  :deep(.el-checkbox__label) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: normal;
    word-break: break-word;
  }
}

.option-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.other {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.other-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-skip,
.btn-submit {
  min-width: 88px;
}

// ===== Collapsed summary =====
.collapsed {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collapsed-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  color: var(--el-text-color-regular);
}

.check {
  color: var(--el-color-success);
  font-weight: 700;
}

.collapsed-q {
  color: var(--el-text-color-secondary);
}

.collapsed-arrow {
  color: var(--el-text-color-placeholder);
}

.collapsed-a {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

@media (max-width: 480px) {
  .ask-user-question-card {
    padding: 10px 12px;
  }
  .actions {
    justify-content: stretch;
    .btn-skip,
    .btn-submit {
      flex: 1;
    }
  }
}
</style>
