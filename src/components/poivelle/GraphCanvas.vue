<template>
  <div class="graph-canvas" @click.self="$emit('select-node', undefined)">
    <svg class="connections" aria-hidden="true">
      <line
        v-for="edge in visibleEdges"
        :key="edge.id"
        :x1="center(edge.source.node_id).x"
        :y1="center(edge.source.node_id).y"
        :x2="center(edge.target.node_id).x"
        :y2="center(edge.target.node_id).y"
      />
    </svg>
    <button
      v-for="node in graph.nodes"
      :key="node.id"
      type="button"
      :class="['graph-node', `type-${node.node_type}`, { selected: node.id === selectedNodeId }]"
      :style="nodeStyle(node.id)"
      @click.stop="$emit('select-node', node.id)"
    >
      <span class="node-type">{{ node.node_type }}</span>
      <strong>{{ node.title }}</strong>
      <span class="node-summary">{{ summary(node) }}</span>
      <span v-if="node.locked_paths.length" class="lock-mark"><LockKeyhole :size="11" /> locked</span>
    </button>
    <div v-if="!graph.nodes.length" class="empty-canvas">
      <GitBranch :size="28" stroke-width="1.5" aria-hidden="true" />
      <h2>{{ $t('poivelle.graph.emptyTitle') }}</h2>
      <p>{{ $t('poivelle.graph.emptyBody') }}</p>
      <button v-if="canEdit" type="button" @click="$emit('create-node')">
        <Plus :size="15" aria-hidden="true" />
        {{ $t('poivelle.node.create') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { GitBranch, LockKeyhole, Plus } from '@lucide/vue';
import type { IPoivelleGraphNode, IPoivelleGraphSnapshot } from '@/models';

const props = defineProps<{
  graph: IPoivelleGraphSnapshot;
  selectedNodeId?: string;
  canEdit: boolean;
}>();

defineEmits<{
  'select-node': [nodeId?: string];
  'create-node': [];
}>();

const layoutByNode = computed(() => new Map(props.graph.layouts.map((layout) => [layout.node_id, layout])));
const fallback = (nodeId: string) => {
  const index = props.graph.nodes.findIndex((node) => node.id === nodeId);
  return { x: 52 + (index % 3) * 250, y: 54 + Math.floor(index / 3) * 170, width: 208, height: 116 };
};
const layout = (nodeId: string) => layoutByNode.value.get(nodeId) ?? fallback(nodeId);
const center = (nodeId: string) => {
  const item = layout(nodeId);
  return { x: item.x + item.width / 2, y: item.y + item.height / 2 };
};
const nodeStyle = (nodeId: string) => {
  const item = layout(nodeId);
  return { left: `${item.x}px`, top: `${item.y}px`, width: `${item.width}px`, minHeight: `${item.height}px` };
};
const visibleEdges = computed(() =>
  props.graph.edges.filter(
    (edge) =>
      props.graph.nodes.some((node) => node.id === edge.source.node_id) &&
      props.graph.nodes.some((node) => node.id === edge.target.node_id)
  )
);
const summary = (node: IPoivelleGraphNode) => {
  const text = node.payload.text ?? node.payload.prompt ?? node.payload.description;
  return typeof text === 'string' && text ? text : `Version ${node.version}`;
};
</script>

<style scoped>
.graph-canvas {
  position: relative;
  min-width: 820px;
  min-height: 620px;
  height: 100%;
  overflow: auto;
  background-color: var(--poivelle-canvas);
  background-image:
    linear-gradient(var(--poivelle-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--poivelle-grid) 1px, transparent 1px);
  background-size: 24px 24px;
}

.connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connections line {
  stroke: color-mix(in srgb, var(--app-brand-hex) 32%, var(--poivelle-line-strong));
  stroke-width: 1.25;
  stroke-dasharray: 5 5;
}

.graph-node {
  position: absolute;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 7px;
  padding: 12px 13px;
  border: 1px solid var(--poivelle-line);
  border-radius: var(--poivelle-radius);
  box-shadow: var(--poivelle-shadow);
  color: var(--poivelle-ink);
  background: var(--poivelle-paper);
  text-align: left;
  cursor: pointer;
}

.graph-node:hover,
.graph-node.selected {
  border-color: color-mix(in srgb, var(--app-brand-hex) 58%, transparent);
}

.graph-node.selected {
  box-shadow:
    0 0 0 3px rgba(var(--app-brand-rgb), 0.12),
    var(--app-shadow-md);
}

.graph-node:focus-visible,
.empty-canvas button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--app-brand-hex) 38%, transparent);
  outline-offset: 2px;
}

.node-type {
  width: fit-content;
  padding: 2px 6px;
  border-radius: var(--adc-radius-full);
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-hover);
  font-size: 9px;
  font-weight: 650;
}

.graph-node strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--poivelle-muted);
  font-size: 10px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lock-mark {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--poivelle-muted);
  font-size: 9px;
}

.type-character,
.type-location,
.type-prop {
  border-left: 3px solid var(--el-color-success);
}

.type-shot,
.type-storyboard,
.type-scene {
  border-left: 3px solid var(--app-brand-hex);
}

.type-audio,
.type-subtitle {
  border-left: 3px solid var(--el-color-warning);
}

.empty-canvas {
  position: absolute;
  left: 50%;
  top: 45%;
  display: grid;
  justify-items: center;
  width: min(380px, 80vw);
  transform: translate(-50%, -50%);
  color: var(--poivelle-muted);
  text-align: center;
}

.empty-canvas h2 {
  margin: 12px 0 6px;
  color: var(--poivelle-ink);
  font-size: 22px;
  font-weight: 650;
}

.empty-canvas p {
  margin: 0 0 18px;
  font-size: 12px;
  line-height: 1.5;
}

.empty-canvas button {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 13px;
  border: 1px solid var(--app-brand-hex);
  border-radius: var(--poivelle-radius-small);
  color: #fff;
  background: var(--app-brand-hex);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
</style>
