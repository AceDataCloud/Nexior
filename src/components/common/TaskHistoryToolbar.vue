<template>
  <div class="task-history-toolbar">
    <div class="history-controls">
      <el-date-picker
        :model-value="date || undefined"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        :placeholder="$t('common.history.jumpToDate')"
        :aria-label="$t('common.history.jumpToDate')"
        :disabled="busy"
        :disabled-date="isFutureDate"
        :clearable="false"
        class="history-date"
        @update:model-value="$emit('date-change', $event || '')"
      />
      <el-button :disabled="busy || !hasMore" :loading="busy" @click="$emit('load-more')">
        {{ $t('common.history.loadEarlier') }}
      </el-button>
      <el-button :disabled="busy" @click="$emit('date-change', '')">
        {{ $t('common.history.backToLatest') }}
      </el-button>
    </div>
    <span v-if="error" class="history-error" role="alert">{{ $t('common.history.loadFailed') }}</span>
    <span v-else-if="date" class="history-hint">{{ $t('common.history.throughDate', { date }) }}</span>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElDatePicker } from 'element-plus';

defineProps<{ date: string; busy: boolean; hasMore: boolean; error: boolean }>();
defineEmits<{ 'date-change': [date: string]; 'load-more': [] }>();
function isFutureDate(date: Date) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() > today.getTime();
}
</script>

<style scoped lang="scss">
.task-history-toolbar {
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.history-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  :deep(.history-date) {
    width: 170px;
    flex: 0 1 170px;
  }
}
.history-hint,
.history-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.history-error {
  color: var(--el-color-danger);
}
</style>
