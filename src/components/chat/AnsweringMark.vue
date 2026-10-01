<template>
  <div class="answering-mark" role="status" aria-live="polite">
    <motion-orb :size="28" />
    <span>{{ $t('chat.thinking.inProgress') }}</span>
  </div>
</template>

<script setup lang="ts">
import MotionOrb from '@/components/common/MotionOrb.vue';
</script>

<style scoped>
.answering-mark {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 34px;
  margin-top: 3px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
</style>
