<template>
  <div class="storyboard-view">
    <article
      v-for="(node, index) in storyboardNodes"
      :key="node.id"
      :class="['story-card', { selected: node.id === selectedNodeId }]"
      @click="$emit('select-node', node.id)"
    >
      <div class="frame">
        <span class="frame-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <Clapperboard :size="30" stroke-width="1.25" aria-hidden="true" />
        <span>{{ node.node_type }}</span>
      </div>
      <div class="story-copy">
        <strong>{{ node.title }}</strong>
        <p>{{ node.payload.prompt || node.payload.text || $t('poivelle.storyboard.noPrompt') }}</p>
      </div>
    </article>
    <div v-if="!storyboardNodes.length" class="empty-view">
      <Clapperboard :size="30" stroke-width="1.4" />
      <h2>{{ $t('poivelle.storyboard.emptyTitle') }}</h2>
      <p>{{ $t('poivelle.storyboard.emptyBody') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clapperboard } from '@lucide/vue';
import type { IPoivelleGraphSnapshot } from '@/models';

const props = defineProps<{ graph: IPoivelleGraphSnapshot; selectedNodeId?: string }>();
defineEmits<{ 'select-node': [nodeId: string] }>();
const storyboardNodes = computed(() =>
  props.graph.nodes.filter((node) => ['storyboard', 'scene', 'shot', 'image', 'video'].includes(node.node_type))
);
</script>

<style scoped>
.storyboard-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  align-content: start;
  gap: 14px;
  height: 100%;
  padding: 18px;
  overflow: auto;
  background: var(--poivelle-canvas);
}

.story-card {
  min-width: 0;
  border: 1px solid var(--poivelle-line-strong);
  background: var(--poivelle-paper);
  cursor: pointer;
}

.story-card.selected {
  border-color: var(--poivelle-red);
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--poivelle-red) 22%, transparent);
}

.frame {
  position: relative;
  display: grid;
  place-content: center;
  justify-items: center;
  aspect-ratio: 16 / 9;
  gap: 6px;
  color: var(--poivelle-muted);
  background: #dce2dc;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  text-transform: uppercase;
}

.frame-number {
  position: absolute;
  left: 8px;
  top: 7px;
  color: var(--poivelle-red);
  font-weight: 700;
}

.story-copy {
  padding: 11px;
}

.story-copy strong {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
}

.story-copy p {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--poivelle-muted);
  font-size: 10px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.empty-view {
  grid-column: 1 / -1;
  display: grid;
  place-content: center;
  justify-items: center;
  min-height: 340px;
  color: var(--poivelle-muted);
  text-align: center;
}

.empty-view h2 {
  margin: 12px 0 5px;
  color: var(--poivelle-ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
}

.empty-view p {
  margin: 0;
  font-size: 11px;
}
</style>
