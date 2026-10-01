<template>
  <div class="answering-mark" role="status" aria-live="polite">
    <particle-sphere :size="18" />
    <span>{{ $t('chat.thinking.inProgress') }}</span>
  </div>
</template>

<script setup lang="ts">
import ParticleSphere from '@/components/common/ParticleSphere.vue';
</script>

<style scoped>
.answering-mark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 22px;
  /* Center the 22px waiting line on the model avatar, including its 4px top inset. */
  margin-top: calc((var(--chat-avatar-size, 32px) - 22px) / 2 + 4px);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}
</style>
