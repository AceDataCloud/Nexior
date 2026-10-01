<template>
  <details class="chat-loading-review" open>
    <summary>{{ $t('common.loadingLab.integration') }} · ChatGPT</summary>
    <div class="review-controls">
      <label>
        {{ $t('common.loadingLab.choose') }}
        <select :value="options.tool" @change="selectTool">
          <option v-for="tool in loadingTools" :key="tool.id" :value="tool.id">{{ tool.name }}</option>
        </select>
      </label>
      <button v-for="item in stages" :key="item" :aria-pressed="stage === item" @click="stage = item">
        {{ $t(`common.loadingLab.${item}`) }}
      </button>
    </div>
    <p class="review-caption">{{ $t('common.loadingLab.noBilling') }}</p>
    <message
      :message="example"
      :application="undefined"
      :model-name="modelName"
      :model-group-override="modelGroup"
      :loading-options="options"
      :answering="stage === 'waiting' || stage === 'reasoning' || stage === 'replying'"
      readonly
    />
    <p class="review-caption">{{ $t(`common.loadingLab.note.${options.tool}`) }}</p>
  </details>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';
import { t } from '@/i18n';
import { IChatMessageState, type IChatMessage, type IChatModelGroup } from '@/models';
import { isLoadingTool, loadingTools, type LoadingOptions, type LoadingTool } from '@/components/loading/catalog';
import Message from './Message.vue';

defineProps({
  options: { type: Object as PropType<LoadingOptions>, required: true },
  modelName: { type: String, default: undefined },
  modelGroup: { type: Object as PropType<IChatModelGroup>, default: undefined }
});
const emit = defineEmits<{ selectTool: [tool: LoadingTool] }>();
const stages = ['waiting', 'reasoning', 'replying', 'complete', 'failed'] as const;
const stage = ref<(typeof stages)[number]>('waiting');
// This preview-only row never enters Conversation.messages, history, or a request body.
const example = computed<IChatMessage>(() => ({
  role: 'assistant',
  content: stage.value === 'replying' || stage.value === 'complete' ? t('common.loadingLab.reply') : '',
  thinking: stage.value === 'reasoning' ? t('common.loadingLab.reasoningCopy') : undefined,
  state:
    stage.value === 'waiting'
      ? IChatMessageState.PENDING
      : stage.value === 'complete'
        ? IChatMessageState.FINISHED
        : stage.value === 'failed'
          ? IChatMessageState.FAILED
          : IChatMessageState.ANSWERING,
  error:
    stage.value === 'failed' ? { code: 'stream_interrupted', message: t('common.loadingLab.failedCopy') } : undefined
}));
function selectTool(event: Event) {
  const tool = (event.target as HTMLSelectElement).value;
  if (isLoadingTool(tool)) emit('selectTool', tool);
}
</script>

<style scoped>
.chat-loading-review {
  flex-shrink: 0;
  max-height: 45%;
  overflow: auto;
  margin: 8px auto;
  padding: 12px 16px;
  width: calc(100% - 32px);
  max-width: 800px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  font-size: 13px;
}
summary {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}
.review-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.review-controls select,
.review-controls button {
  padding: 5px 9px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}
.review-controls button[aria-pressed='true'] {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.review-caption {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
