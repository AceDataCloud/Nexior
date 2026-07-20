<template>
  <nav class="projection-tabs" :aria-label="$t('poivelle.projection.label')">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :class="{ active: modelValue === item.value }"
      @click="$emit('update:modelValue', item.value)"
    >
      <component :is="item.icon" :size="14" aria-hidden="true" />
      {{ $t(item.label) }}
    </button>
    <span class="spacer" />
    <button v-if="canEdit" class="add-node" type="button" @click="$emit('create-node')">
      <Plus :size="14" aria-hidden="true" />
      {{ $t('poivelle.node.create') }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { Clapperboard, GitBranch, ListChecks, Plus, Rows3 } from '@lucide/vue';
import type { PoivelleProjection } from '@/models';

defineProps<{ modelValue: PoivelleProjection; canEdit: boolean }>();
defineEmits<{
  'update:modelValue': [projection: PoivelleProjection];
  'create-node': [];
}>();
const items = [
  { value: 'canvas' as const, label: 'poivelle.projection.canvas', icon: GitBranch },
  { value: 'storyboard' as const, label: 'poivelle.projection.storyboard', icon: Clapperboard },
  { value: 'timeline' as const, label: 'poivelle.projection.timeline', icon: Rows3 },
  { value: 'review' as const, label: 'poivelle.projection.review', icon: ListChecks }
];
</script>

<style scoped>
.projection-tabs {
  display: flex;
  align-items: center;
  height: 48px;
  min-height: 48px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
  overflow-x: auto;
}

.projection-tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 36px;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--poivelle-radius-small);
  color: var(--poivelle-muted);
  background: transparent;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.projection-tabs button.active {
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-hover);
  font-weight: 700;
  box-shadow: inset 0 -2px 0 var(--app-brand-hex);
}

.projection-tabs button:hover {
  color: var(--app-brand-hex);
  background: var(--poivelle-hover);
}

.projection-tabs button:focus-visible {
  outline: 2px solid var(--app-brand-hex);
  outline-offset: 2px;
}

.spacer {
  flex: 1;
  min-width: 8px;
}

.projection-tabs .add-node {
  color: var(--app-brand-hex);
}

@media (max-width: 767px) {
  .projection-tabs button {
    min-width: 44px;
    font-size: 0;
  }

  .projection-tabs .add-node {
    min-width: 44px;
  }
}
</style>
