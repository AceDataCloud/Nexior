<template>
  <div class="answering-mark" role="status" aria-live="polite">
    <particle-sphere :size="40" />
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
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  min-height: 58px;
  padding: 8px 18px 8px 10px;
  margin-top: 4px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.4;
}
</style>
