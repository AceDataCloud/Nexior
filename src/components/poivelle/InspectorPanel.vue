<template>
  <aside class="inspector-panel">
    <div class="inspector-heading">
      <div>
        <span>{{ $t('poivelle.section.inspector') }}</span>
        <strong>{{ node?.title || $t('poivelle.inspector.noSelection') }}</strong>
      </div>
      <component :is="nodeIcon" :size="18" aria-hidden="true" />
    </div>

    <template v-if="node">
      <label class="field">
        <span>{{ $t('poivelle.field.title') }}</span>
        <input v-model="draftTitle" type="text" @blur="saveTitle" @keydown.enter="saveTitle" />
      </label>
      <label class="field">
        <span>{{ $t('poivelle.field.type') }}</span>
        <input :value="node.node_type" type="text" disabled />
      </label>
      <label class="field grow">
        <span>{{ $t('poivelle.field.prompt') }}</span>
        <textarea v-model="draftPrompt" rows="8" @blur="savePrompt" />
      </label>
      <div class="node-meta">
        <span>NODE</span>
        <code>{{ node.id }}</code>
        <span>VERSION</span>
        <code>{{ node.version }}</code>
      </div>
      <button class="danger-button" type="button" @click="$emit('delete')">
        <Trash2 :size="14" aria-hidden="true" />
        {{ $t('poivelle.node.delete') }}
      </button>
    </template>
    <div v-else class="empty-inspector">
      <MousePointer2 :size="24" stroke-width="1.4" />
      <p>{{ $t('poivelle.inspector.empty') }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue';
import { AudioLines, Box, Clapperboard, FileText, Image, MousePointer2, Trash2, Video } from '@lucide/vue';
import type { IPoivelleGraphNode } from '@/models';

const props = defineProps<{ node?: IPoivelleGraphNode }>();
const emit = defineEmits<{
  update: [payload: { path: string; value: unknown }];
  delete: [];
}>();

const draftTitle = ref('');
const draftPrompt = ref('');
watch(
  () => props.node,
  (node) => {
    draftTitle.value = node?.title ?? '';
    const prompt = node?.payload.prompt ?? node?.payload.text ?? '';
    draftPrompt.value = typeof prompt === 'string' ? prompt : '';
  },
  { immediate: true }
);
const nodeIcon = computed<Component>(() => {
  if (!props.node) return MousePointer2;
  if (props.node.node_type === 'video') return Video;
  if (props.node.node_type === 'audio') return AudioLines;
  if (['shot', 'scene', 'storyboard'].includes(props.node.node_type)) return Clapperboard;
  if (['image', 'character', 'location'].includes(props.node.node_type)) return Image;
  if (props.node.node_type === 'script' || props.node.node_type === 'text') return FileText;
  return Box;
});
const saveTitle = () => {
  const value = draftTitle.value.trim();
  if (props.node && value && value !== props.node.title) emit('update', { path: '/title', value });
};
const savePrompt = () => {
  if (!props.node) return;
  const key = props.node.payload.prompt !== undefined ? 'prompt' : 'text';
  if (draftPrompt.value !== props.node.payload[key])
    emit('update', { path: `/payload/${key}`, value: draftPrompt.value });
};
</script>

<style scoped>
.inspector-panel {
  display: flex;
  flex-direction: column;
  width: 272px;
  min-width: 272px;
  min-height: 0;
  padding: 14px;
  border-left: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
  overflow-y: auto;
}

.inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--poivelle-line);
}

.inspector-heading div {
  display: grid;
  min-width: 0;
}

.inspector-heading span,
.field > span,
.node-meta > span {
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.inspector-heading strong {
  overflow: hidden;
  margin-top: 4px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 13px;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--poivelle-line-strong);
  border-radius: 0;
  color: var(--poivelle-ink);
  background: var(--poivelle-canvas);
  font: inherit;
  font-size: 11px;
  outline: none;
}

.field input {
  height: 34px;
  padding: 0 9px;
}

.field textarea {
  min-height: 120px;
  padding: 9px;
  line-height: 1.5;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--poivelle-red);
}

.field input:disabled {
  color: var(--poivelle-muted);
}

.node-meta {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  gap: 7px 8px;
  padding: 11px 0;
  border-top: 1px solid var(--poivelle-line);
  border-bottom: 1px solid var(--poivelle-line);
}

.node-meta code {
  overflow: hidden;
  color: var(--poivelle-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  gap: 7px;
  margin-top: 14px;
  border: 1px solid #bd5b50;
  color: #a63329;
  background: transparent;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.empty-inspector {
  display: grid;
  place-content: center;
  justify-items: center;
  flex: 1;
  color: var(--poivelle-muted);
  text-align: center;
}

.empty-inspector p {
  max-width: 170px;
  margin: 10px 0 0;
  font-size: 10px;
  line-height: 1.5;
}

@media (max-width: 1120px) {
  .inspector-panel {
    width: 236px;
    min-width: 236px;
  }
}

@media (max-width: 900px) {
  .inspector-panel {
    display: none;
  }
}
</style>
