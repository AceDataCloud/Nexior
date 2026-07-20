<template>
  <section class="media-lane">
    <header>
      <span>{{ title }}</span>
      <button v-if="nodeIds[0]" type="button" @click="$emit('select-node', nodeIds[0])">
        {{ $t('poivelle.storyboard.openNode') }}
      </button>
    </header>
    <div v-if="candidates.length" class="candidate-strip">
      <article
        v-for="candidate in candidates"
        :key="candidate.key"
        :class="['candidate', { selected: candidate.selected }]"
      >
        <img v-if="kind === 'image'" :src="candidate.artifact.storage_url" alt="" />
        <video v-else :src="candidate.artifact.storage_url" controls preload="metadata" />
        <div>
          <span>{{ candidate.take ? 'TAKE' : 'ARTIFACT' }}</span>
          <strong>{{ candidate.artifact.id.slice(-8) }}</strong>
          <button
            v-if="canEdit && canSelect && candidate.take && !candidate.selected"
            type="button"
            @click="$emit('select-take', { target_node_id: candidate.take.target_node_id, take_id: candidate.take.id })"
          >
            {{ $t('poivelle.storyboard.selectTake') }}
          </button>
          <em v-else-if="candidate.selected">{{ $t('poivelle.storyboard.selected') }}</em>
        </div>
      </article>
    </div>
    <div v-if="unavailableTakes.length" class="unavailable-takes">
      <span v-for="take in unavailableTakes" :key="take.id">
        {{ take.state === 'failed' ? $t('poivelle.storyboard.failedTake') : $t('poivelle.storyboard.restrictedTake') }}
      </span>
    </div>
    <div v-if="!candidates.length && !unavailableTakes.length" class="empty-candidates">
      {{ $t('poivelle.storyboard.noCandidates') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { IPoivelleArtifact, IPoivelleSelection, IPoivelleTake } from '@/models';

const props = defineProps<{
  title: string;
  kind: 'image' | 'video';
  nodeIds: string[];
  artifacts: IPoivelleArtifact[];
  takes: IPoivelleTake[];
  selections: IPoivelleSelection[];
  canEdit: boolean;
  canSelect: boolean;
}>();
defineEmits<{
  'select-node': [nodeId: string];
  'select-take': [payload: { target_node_id: string; take_id: string }];
}>();

const candidates = computed(() => {
  const nodeSet = new Set(props.nodeIds);
  const artifactsById = new Map(props.artifacts.map((artifact) => [artifact.id, artifact]));
  const takeCandidates = props.takes
    .filter((take) => nodeSet.has(take.target_node_id) && take.state === 'ready')
    .flatMap((take) =>
      [...new Set(take.artifact_ids)]
        .map((artifactId) => artifactsById.get(artifactId))
        .filter((artifact): artifact is IPoivelleArtifact => Boolean(artifact))
        .map((artifact) => ({
          key: `${take.id}:${artifact.id}`,
          take,
          artifact,
          selected: props.selections.some(
            (selection) => selection.target_node_id === take.target_node_id && selection.take_id === take.id
          )
        }))
    );
  const covered = new Set(takeCandidates.map((candidate) => candidate.artifact.id));
  const ungrouped = props.artifacts
    .filter(
      (artifact) => nodeSet.has(artifact.node_id ?? '') && artifact.kind === props.kind && !covered.has(artifact.id)
    )
    .map((artifact) => ({ key: artifact.id, take: undefined, artifact, selected: false }));
  return [...takeCandidates, ...ungrouped];
});
const unavailableTakes = computed(() =>
  props.takes.filter((take) => props.nodeIds.includes(take.target_node_id) && take.state !== 'ready')
);
</script>

<style scoped>
.media-lane {
  min-width: 0;
  padding: 10px;
  border-right: 1px solid var(--poivelle-line);
}
.media-lane:last-child {
  border-right: 0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}
header span {
  font:
    9px 'Courier New',
    monospace;
  text-transform: uppercase;
}
header button,
.candidate button {
  padding: 0;
  border: 0;
  color: var(--poivelle-red);
  background: transparent;
  font: 9px inherit;
  cursor: pointer;
}
.candidate-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}
.candidate {
  flex: 0 0 132px;
  overflow: hidden;
  border: 1px solid var(--poivelle-line-strong);
  background: var(--poivelle-canvas);
}
.candidate.selected {
  border-color: var(--poivelle-green);
  box-shadow: inset 0 -3px 0 var(--poivelle-green);
}
.candidate img,
.candidate video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #111;
}
.candidate > div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 6px;
  padding: 6px;
}
.candidate span {
  color: var(--poivelle-muted);
  font:
    8px 'Courier New',
    monospace;
}
.candidate strong {
  grid-column: 1 / -1;
  font-size: 9px;
}
.candidate em {
  color: var(--poivelle-green);
  font-size: 8px;
  font-style: normal;
  font-weight: 700;
}
.empty-candidates {
  display: grid;
  min-height: 82px;
  place-items: center;
  border: 1px dashed var(--poivelle-line);
  color: var(--poivelle-muted);
  font-size: 9px;
}
.unavailable-takes {
  display: grid;
  gap: 4px;
}
.unavailable-takes span {
  padding: 7px;
  border: 1px solid var(--poivelle-line);
  color: var(--poivelle-muted);
  background: var(--poivelle-canvas);
  font-size: 9px;
}
</style>
