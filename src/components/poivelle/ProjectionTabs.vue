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
  align-items: stretch;
  height: 40px;
  min-height: 40px;
  border-bottom: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
  overflow-x: auto;
}

.projection-tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  border-right: 1px solid var(--poivelle-line);
  color: var(--poivelle-muted);
  background: transparent;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.projection-tabs button.active {
  color: var(--poivelle-ink);
  background: var(--poivelle-mint);
  font-weight: 700;
}

.spacer {
  flex: 1;
  min-width: 8px;
}

.projection-tabs .add-node {
  border-left: 1px solid var(--poivelle-line);
  border-right: 0;
  color: var(--poivelle-ink);
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
