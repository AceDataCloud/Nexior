<template>
  <article class="task-result" :data-state="state">
    <header v-if="$slots.intent" class="task-result__intent">
      <slot name="intent" />
    </header>

    <section v-if="$slots.references" class="task-result__references" role="region" :aria-label="referencesLabel">
      <slot name="references" />
    </section>

    <div class="task-result__status" :aria-live="live ? 'polite' : 'off'">
      <slot name="status">{{ statusLabel }}</slot>
    </div>

    <section class="task-result__output" role="region" :aria-label="outputLabel">
      <slot v-if="$slots.output" name="output" />
      <p v-else class="task-result__placeholder">{{ outputUnavailableLabel }}</p>
    </section>

    <div v-if="$slots.actions" class="task-result__actions">
      <slot name="actions" />
    </div>

    <dl v-if="metadata.length" class="task-result__metadata">
      <template v-for="item in metadata" :key="item.key">
        <dt>{{ item.label }}</dt>
        <dd :title="item.value">{{ item.value }}</dd>
      </template>
    </dl>
    <p v-else-if="legacy" class="task-result__legacy">{{ legacyLabel }}</p>

    <div v-if="error" class="task-result__error" role="alert">
      <strong>{{ error.title }}</strong>
      <p>{{ error.reason }}</p>
      <code v-if="error.traceId">{{ error.traceId }}</code>
    </div>
  </article>
</template>

<script setup lang="ts">
export type TaskResultState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface TaskResultMetadataItem {
  key: string;
  label: string;
  value: string;
}

export interface TaskResultError {
  title: string;
  reason: string;
  traceId?: string;
}

withDefaults(
  defineProps<{
    state: TaskResultState;
    statusLabel: string;
    referencesLabel: string;
    outputLabel: string;
    outputUnavailableLabel: string;
    legacyLabel: string;
    metadata?: readonly TaskResultMetadataItem[];
    error?: TaskResultError;
    legacy?: boolean;
    live?: boolean;
  }>(),
  {
    metadata: () => [],
    error: undefined,
    legacy: false,
    live: false
  }
);
</script>

<style lang="scss" scoped>
.task-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.task-result__intent {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 22px;
  overflow-wrap: anywhere;
}

.task-result__references,
.task-result__output {
  min-width: 0;
}

.task-result__status,
.task-result__legacy,
.task-result__placeholder {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.task-result__placeholder,
.task-result__legacy {
  margin: 0;
}

.task-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.task-result__metadata {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px 12px;
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  font-size: 12px;
  line-height: 18px;
}

.task-result__metadata dt {
  max-width: 12rem;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.task-result__metadata dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.task-result__error {
  padding: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
}

.task-result__error p {
  margin: 4px 0;
}

.task-result__error code {
  overflow-wrap: anywhere;
}
</style>
