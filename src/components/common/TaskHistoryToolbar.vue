<template>
  <div class="task-history-toolbar">
    <button
      v-if="date"
      type="button"
      class="history-date-chip"
      :disabled="busy"
      :aria-label="`${$t('common.history.throughDate', { date })} · ${$t('common.history.backToLatest')}`"
      :title="$t('common.history.backToLatest')"
      @click="selectDate('')"
    >
      <span class="history-date-full">{{ date }}</span>
      <span class="history-date-short" aria-hidden="true">{{ date.slice(5) }}</span>
      <close-icon :size="12" aria-hidden="true" focusable="false" />
    </button>
    <el-popover
      v-model:visible="open"
      trigger="click"
      placement="bottom-end"
      :width="280"
      :popper-style="{ overflow: 'visible' }"
      :persistent="false"
      :show-arrow="false"
      :hide-after="0"
    >
      <template #reference>
        <el-button
          text
          circle
          class="history-menu-trigger"
          :class="{ 'has-error': error }"
          :aria-label="$t('common.history.options')"
          :title="$t('common.history.options')"
          :aria-expanded="open"
          :aria-busy="busy"
        >
          <more-icon :size="18" aria-hidden="true" focusable="false" />
          <span v-if="error" class="history-error-dot" aria-hidden="true" />
        </el-button>
      </template>
      <div class="history-menu" role="group" :aria-label="$t('common.history.options')" @keydown.esc="open = false">
        <label :for="dateInputId" class="history-menu-label">{{ $t('common.history.jumpToDate') }}</label>
        <el-date-picker
          :id="dateInputId"
          :model-value="date || undefined"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          :placeholder="$t('common.history.jumpToDate')"
          :aria-label="$t('common.history.jumpToDate')"
          :disabled="busy"
          :disabled-date="isFutureDate"
          :clearable="false"
          :teleported="false"
          class="history-date"
          @update:model-value="selectDate($event || '')"
        />
        <span v-if="date" class="history-hint">{{ $t('common.history.throughDate', { date }) }}</span>
        <div class="history-menu-actions">
          <el-button text :disabled="busy || !hasMore" :loading="busy" @click="loadEarlier">
            {{ $t('common.history.loadEarlier') }}
          </el-button>
          <el-button text :disabled="busy" @click="selectDate('')">
            {{ $t('common.history.backToLatest') }}
          </el-button>
        </div>
        <span v-if="error" class="history-error" role="alert">{{ $t('common.history.loadFailed') }}</span>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import { ElButton, ElDatePicker, ElPopover } from 'element-plus';
import { CloseIcon, MoreIcon } from '@acedatacloud/core/icons/components';

const props = defineProps<{ date: string; busy: boolean; hasMore: boolean; error: boolean }>();
const emit = defineEmits<{ 'date-change': [date: string]; 'load-more': [] }>();
const open = ref(false);
const dateInputId = `history-date-${useId()}`;

function selectDate(date: string) {
  if (props.busy) return;
  open.value = false;
  emit('date-change', date);
}
function loadEarlier() {
  if (props.busy || !props.hasMore) return;
  open.value = false;
  emit('load-more');
}
function isFutureDate(date: Date) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() > today.getTime();
}
watch(
  () => props.error,
  (error) => {
    if (error) open.value = true;
  }
);
</script>

<style scoped lang="scss">
.task-history-toolbar {
  display: flex;
  flex: none;
  align-self: flex-end;
  align-items: center;
  gap: 6px;
  margin: 4px 12px;
}
.history-menu-trigger {
  position: relative;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  color: var(--el-text-color-secondary);
}
.history-date-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 2px 8px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}
.history-date-short {
  display: none;
}
.history-error-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
}
.history-menu-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.history-menu :deep(.history-date) {
  width: 100%;
}
.history-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter);
  :deep(.el-button) {
    justify-content: flex-start;
    margin: 0;
  }
}
.history-hint,
.history-error {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.history-error {
  color: var(--el-color-danger);
}
@media (max-width: 600px) {
  .history-date-full {
    display: none;
  }
  .history-date-short {
    display: inline;
  }
}
@media (pointer: coarse) {
  .history-menu-trigger {
    width: 40px;
    height: 40px;
  }
  .history-date-chip {
    min-height: 32px;
  }
}
</style>
