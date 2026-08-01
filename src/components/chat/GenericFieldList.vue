<template>
  <div class="generic-field-list">
    <p v-if="summary" class="gfl-summary">{{ summary }}</p>
    <dl v-if="fields.length > 0" class="gfl-fields">
      <div v-for="(field, idx) in fields" :key="idx" class="gfl-row">
        <dt class="gfl-label">{{ field.label }}</dt>
        <dd class="gfl-value">{{ field.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { IActionConfirmationField } from '@/models';

/**
 * Default body for `<ActionConfirmationCard>`. Also the fallback for any
 * `kind` this build doesn't know — the worker can ship a new kind before
 * the frontend does, and a blank card would be worse than a plain summary.
 */
export default defineComponent({
  name: 'GenericFieldList',
  props: {
    summary: {
      type: String,
      default: ''
    },
    fields: {
      type: Array as PropType<IActionConfirmationField[]>,
      default: () => []
    }
  }
});
</script>

<style lang="scss" scoped>
.generic-field-list {
  .gfl-summary {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }

  .gfl-fields {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .gfl-row {
    display: grid;
    grid-template-columns: minmax(0, 96px) minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .gfl-label {
    margin: 0;
    min-width: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    word-break: break-word;
  }

  .gfl-value {
    margin: 0;
    min-width: 0;
    font-size: 13px;
    color: var(--el-text-color-primary);
    word-break: break-word;
    white-space: pre-wrap;
  }
}
</style>
