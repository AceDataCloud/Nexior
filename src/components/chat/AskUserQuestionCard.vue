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
    </div>

    <!-- Wizard view: one question at a time -->
    <div v-else class="wizard">
      <!-- Progress header -->
      <div class="progress">
        <div class="progress-meta">
          <span class="chip">{{ headerFor(currentQuestion) }}</span>
          <span class="step">
            <span class="step-current">{{ currentIndex + 1 }}</span>
            <span class="step-divider">/</span>
            <span class="step-total">{{ questions.length }}</span>
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Animated question pane (slides on next/back) -->
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentIndex" class="pane">
          <div class="question-text">{{ currentQuestion.question }}</div>
          <div v-if="currentQuestion.multiSelect" class="multi-hint">
            <span class="dot">●</span> {{ $t('chat.askUserQuestion.multiSelectHint') }}
          </div>

          <!-- Single-select -->
          <el-radio-group v-if="!currentQuestion.multiSelect" v-model="singleAnswers[currentIndex]" class="options">
            <el-radio
              v-for="(opt, oIdx) in currentQuestion.options"
              :key="oIdx"
              :value="opt.label"
              class="option"
              :class="{ 'is-active': singleAnswers[currentIndex] === opt.label }"
            >
              <span class="option-label">{{ opt.label }}</span>
              <span v-if="opt.description" class="option-desc">{{ opt.description }}</span>
            </el-radio>
            <el-radio
              :value="OTHER_VALUE"
              class="option option-other"
              :class="{ 'is-active': singleAnswers[currentIndex] === OTHER_VALUE }"
            >
              <span class="option-label">{{ $t('chat.askUserQuestion.other') }}</span>
              <span class="option-desc">{{ $t('chat.askUserQuestion.otherDesc') }}</span>
            </el-radio>
          </el-radio-group>

          <!-- Multi-select -->
          <el-checkbox-group v-else v-model="multiAnswers[currentIndex]" class="options">
            <el-checkbox
              v-for="(opt, oIdx) in currentQuestion.options"
              :key="oIdx"
              :value="opt.label"
              class="option"
              :class="{ 'is-active': (multiAnswers[currentIndex] || []).includes(opt.label) }"
            >
              <span class="option-label">{{ opt.label }}</span>
              <span v-if="opt.description" class="option-desc">{{ opt.description }}</span>
            </el-checkbox>
            <el-checkbox
              :value="OTHER_VALUE"
              class="option option-other"
              :class="{ 'is-active': (multiAnswers[currentIndex] || []).includes(OTHER_VALUE) }"
            >
              <span class="option-label">{{ $t('chat.askUserQuestion.other') }}</span>
              <span class="option-desc">{{ $t('chat.askUserQuestion.otherDesc') }}</span>
            </el-checkbox>
          </el-checkbox-group>

          <!-- Other text input (revealed when "Other" is selected) -->
          <Transition name="reveal">
            <div v-if="needsOtherInput" class="other-wrap">
              <el-input
                v-model="otherTexts[currentIndex]"
                type="textarea"
                :rows="2"
                :placeholder="$t('chat.askUserQuestion.placeholder')"
                resize="none"
                @keydown.enter.exact.prevent="onNext"
              />
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Actions -->
      <div class="actions">
        <el-button class="btn btn-back" text :disabled="currentIndex === 0" @click="onBack">
          ← {{ $t('chat.askUserQuestion.back') }}
        </el-button>
        <el-button class="btn btn-skip" text @click="onSkip">
          {{ $t('chat.askUserQuestion.skipAll') }}
        </el-button>
        <span class="spacer" />
        <el-button class="btn btn-next" type="primary" round :disabled="!canAdvance" @click="onNext">
          {{ isLastQuestion ? $t('chat.askUserQuestion.submit') : $t('chat.askUserQuestion.next') }}
          <span class="arrow">{{ isLastQuestion ? '✓' : '→' }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton, ElCheckbox, ElCheckboxGroup, ElInput, ElRadio, ElRadioGroup } from 'element-plus';
import { IAskUserQuestion, IAskUserQuestionPayload } from '@/models';
import { OTHER_VALUE, buildAskUserQuestionOutput, canAdvanceQuestion, truncateHeader } from './askUserQuestion';

interface IData {
  currentIndex: number;
  transitionName: 'slide-next' | 'slide-back';
  singleAnswers: Record<number, string>;
  multiAnswers: Record<number, string[]>;
  otherTexts: Record<number, string>;
  collapsedAnswers: Record<number, string | string[]> | null;
  OTHER_VALUE: string;
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
     * When `true`, render the read-only collapsed summary. `previousOutput`
     * (the JSON string the user submitted previously) MUST be provided so
     * the card can show what was answered.
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
      currentIndex: 0,
      transitionName: 'slide-next',
      singleAnswers: {},
      multiAnswers: {},
      otherTexts: {},
      collapsedAnswers: null,
      OTHER_VALUE
    };
  },
  computed: {
    questions(): IAskUserQuestion[] {
      return this.payload?.questions ?? [];
    },
    currentQuestion(): IAskUserQuestion {
      return this.questions[this.currentIndex] ?? { question: '', header: '', options: [] };
    },
    isLastQuestion(): boolean {
      return this.currentIndex >= this.questions.length - 1;
    },
    progressPercent(): number {
      if (this.questions.length === 0) return 0;
      return ((this.currentIndex + 1) / this.questions.length) * 100;
    },
    needsOtherInput(): boolean {
      const q = this.currentQuestion;
      const idx = this.currentIndex;
      if (q.multiSelect) {
        return (this.multiAnswers[idx] || []).includes(OTHER_VALUE);
      }
      return this.singleAnswers[idx] === OTHER_VALUE;
    },
    canAdvance(): boolean {
      return canAdvanceQuestion(
        this.currentQuestion,
        this.currentIndex,
        this.singleAnswers,
        this.multiAnswers,
        this.otherTexts
      );
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
      return truncateHeader(q?.header ?? '');
    },
    onNext() {
      if (!this.canAdvance) return;
      if (this.isLastQuestion) {
        this.submit();
        return;
      }
      this.transitionName = 'slide-next';
      this.currentIndex += 1;
    },
    onBack() {
      if (this.currentIndex === 0) return;
      this.transitionName = 'slide-back';
      this.currentIndex -= 1;
    },
    submit() {
      const output = buildAskUserQuestionOutput(this.questions, this.singleAnswers, this.multiAnswers, this.otherTexts);
      this.$emit('submit', { tool_use_id: this.toolUseId, output });
    },
    onSkip() {
      this.$emit('skip', { tool_use_id: this.toolUseId });
    },
    parsePreviousOutput() {
      this.collapsedAnswers = null;
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
        }
      } catch {
        // Output isn't valid JSON; collapsed view will fall back to "—".
      }
    },
    collapsedAnswerFor(q: IAskUserQuestion): string {
      if (!this.collapsedAnswers) return '—';
      const idx = this.questions.indexOf(q);
      const v = this.collapsedAnswers[idx];
      if (!v) return '—';
      return Array.isArray(v) ? v.join(', ') : v;
    }
  }
});
</script>

<style lang="scss" scoped>
.ask-user-question-card {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  padding: 18px 20px 14px;
  font-size: 14px;
  max-width: 100%;
  box-shadow:
    0 4px 16px -8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  animation: askCardEnter 280ms cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.ask-user-question-card.is-collapsed {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: none;
  padding: 10px 14px;
  font-size: 13px;
  animation: none;
}

@keyframes askCardEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// ===== Wizard layout =====

.wizard {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ----- Progress -----

.progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.step {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.step-current {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.step-divider {
  margin: 0 3px;
  color: var(--el-text-color-placeholder);
}

.progress-track {
  position: relative;
  height: 3px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
  border-radius: 999px;
  transition: width 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

// ----- Question pane (animated) -----

.pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.question-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.45;
  letter-spacing: 0.005em;
}

.multi-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: 999px;
  align-self: flex-start;
  font-weight: 500;

  .dot {
    font-size: 6px;
    line-height: 1;
  }
}

// ----- Options -----

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;

  // Element Plus radios/checkboxes default to inline; stack and theme.
  :deep(.el-radio),
  :deep(.el-checkbox) {
    margin-right: 0;
    height: auto;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    align-items: flex-start;
    white-space: normal;
    width: 100%;
    box-sizing: border-box;
    transition:
      border-color 160ms ease,
      background 160ms ease,
      transform 160ms ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }

  .option.is-active :deep(.el-radio__inner),
  .option.is-active :deep(.el-checkbox__inner) {
    border-color: var(--el-color-primary);
  }

  .option.is-active {
    :deep(.el-radio),
    :deep(.el-checkbox) {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  :deep(.el-radio__label),
  :deep(.el-checkbox__label) {
    display: flex;
    flex-direction: column;
    gap: 3px;
    white-space: normal;
    word-break: break-word;
    padding-left: 6px;
  }

  // Native control alignment (the bullet/checkbox is slightly above the
  // label baseline; nudge it to feel optically centered with multiline).
  :deep(.el-radio__input),
  :deep(.el-checkbox__input) {
    margin-top: 1px;
  }
}

.option-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  line-height: 1.4;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.option-other {
  border-style: dashed !important;

  &.is-active {
    border-style: solid !important;
  }
}

// ----- Other input -----

.other-wrap {
  margin-top: 4px;

  :deep(.el-textarea__inner) {
    border-radius: 10px;
    box-shadow: none;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease;

    &:focus {
      box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
    }
  }
}

// ----- Actions -----

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.btn {
  font-weight: 500;
  letter-spacing: 0.01em;
}

.btn-back {
  color: var(--el-text-color-regular);

  &:not(:disabled):hover {
    color: var(--el-color-primary);
    background: transparent;
  }
}

.btn-skip {
  color: var(--el-text-color-secondary);

  &:hover {
    color: var(--el-color-danger);
    background: transparent;
  }
}

.btn-next {
  min-width: 96px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: 600;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;

  .arrow {
    margin-left: 4px;
    display: inline-block;
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:not(:disabled):hover .arrow {
    transform: translateX(3px);
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }
}

.spacer {
  flex: 1;
}

// ===== Transitions =====

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

.slide-back-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.slide-back-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms ease;
}

.reveal-enter-from {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

.reveal-enter-to,
.reveal-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 120px;
}

.reveal-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

.reveal-enter-active,
.reveal-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    max-height 200ms ease;
  overflow: hidden;
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

// ===== Responsive =====

@media (max-width: 480px) {
  .ask-user-question-card {
    padding: 14px 14px 10px;
    border-radius: 14px;
  }

  .question-text {
    font-size: 15px;
  }

  .actions {
    .btn-next {
      flex: 1;
    }
  }
}
</style>
