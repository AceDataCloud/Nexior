<template>
  <loading-lab system="Nexior" component-name="Message / AnsweringMark">
    <template #default="{ options, stage }">
      <p class="fixture-title">{{ $t('common.loadingLab.conversation') }}</p>
      <chat-message :message="message(stage)" :application="undefined" :loading-options="options" readonly />
    </template>
  </loading-lab>
</template>

<script setup lang="ts">
import { t } from '@/i18n';
import LoadingLab from './LoadingLab.vue';
import ChatMessage from '@/components/chat/Message.vue';
import { IChatMessageState, type IChatMessage } from '@/models';
function message(stage: string): IChatMessage {
  return {
    role: 'assistant',
    content:
      stage === 'replying'
        ? t('common.loadingLab.reply').slice(0, 24)
        : stage === 'complete'
          ? t('common.loadingLab.reply')
          : '',
    thinking: stage === 'reasoning' ? t('common.loadingLab.reasoningCopy') : undefined,
    state:
      stage === 'waiting'
        ? IChatMessageState.PENDING
        : stage === 'complete'
          ? IChatMessageState.FINISHED
          : stage === 'failed'
            ? IChatMessageState.FAILED
            : IChatMessageState.ANSWERING,
    error: stage === 'failed' ? { code: 'stream_interrupted', message: t('common.loadingLab.failedCopy') } : undefined
  };
}
</script>
