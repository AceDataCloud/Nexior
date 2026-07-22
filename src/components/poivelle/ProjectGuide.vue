<template>
  <section class="project-guide" aria-labelledby="project-guide-title">
    <div class="guide-copy">
      <p>{{ $t('poivelle.guide.kicker') }}</p>
      <h1 id="project-guide-title">{{ $t('poivelle.guide.title', { title: projectTitle }) }}</h1>
      <p class="guide-body">{{ $t('poivelle.guide.body') }}</p>
      <dl class="project-facts">
        <div>
          <dt>{{ $t('poivelle.guide.duration') }}</dt>
          <dd>{{ durationSeconds }}s</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.guide.shots') }}</dt>
          <dd>{{ shotCount }}</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.guide.format') }}</dt>
          <dd>{{ aspectRatio }}</dd>
        </div>
      </dl>
      <div class="guide-actions">
        <button
          v-if="nextGenerationNode"
          type="button"
          class="primary-action"
          :disabled="!canEdit || busy"
          @click="$emit('generate-node', nextGenerationNode.id)"
        >
          <LoaderCircle v-if="busy" :size="17" class="spinning" aria-hidden="true" />
          <Sparkles v-else :size="17" aria-hidden="true" />
          {{ nextActionLabel }}
        </button>
        <button v-else type="button" class="primary-action" @click="$emit('open-storyboard')">
          <Clapperboard :size="17" aria-hidden="true" />
          {{ needsSelection ? $t('poivelle.guide.chooseResults') : $t('poivelle.guide.reviewResults') }}
        </button>
        <button type="button" class="secondary-action" @click="$emit('open-storyboard')">
          {{ $t('poivelle.guide.reviewPlan') }}
          <ArrowRight :size="15" aria-hidden="true" />
        </button>
      </div>
      <p class="cost-note"><ShieldCheck :size="14" aria-hidden="true" /> {{ $t('poivelle.guide.costNote') }}</p>
    </div>

    <ol class="production-steps">
      <li class="done">
        <span><Check :size="15" aria-hidden="true" /></span>
        <div>
          <strong>{{ $t('poivelle.guide.stepPlan') }}</strong>
          <p>{{ $t('poivelle.guide.stepPlanBody', { shots: shotCount }) }}</p>
        </div>
        <small>{{ $t('poivelle.guide.ready') }}</small>
      </li>
      <li
        :class="{
          current: imageSelected < imageNodeIds.length,
          done: imageNodeIds.length > 0 && imageSelected === imageNodeIds.length
        }"
      >
        <span>2</span>
        <div>
          <strong>{{ $t('poivelle.guide.stepFrames') }}</strong>
          <p>{{ $t('poivelle.guide.stepFramesBody') }}</p>
          <progress :value="imageReady" :max="Math.max(imageNodeIds.length, 1)" />
        </div>
        <small>
          {{ imageReady }} {{ $t('poivelle.guide.generated') }} · {{ imageSelected }}
          {{ $t('poivelle.guide.selected') }}
        </small>
      </li>
      <li
        :class="{
          current: imageSelected === imageNodeIds.length && videoSelected < videoNodeIds.length,
          done: videoNodeIds.length > 0 && videoSelected === videoNodeIds.length
        }"
      >
        <span>3</span>
        <div>
          <strong>{{ $t('poivelle.guide.stepMotion') }}</strong>
          <p>{{ $t('poivelle.guide.stepMotionBody') }}</p>
          <progress :value="videoReady" :max="Math.max(videoNodeIds.length, 1)" />
        </div>
        <small>
          {{ videoReady }} {{ $t('poivelle.guide.generated') }} · {{ videoSelected }}
          {{ $t('poivelle.guide.selected') }}
        </small>
      </li>
      <li
        v-if="hasOutputNode"
        :class="{ current: videoSelected === videoNodeIds.length && !masterReady, done: masterReady }"
      >
        <span>4</span>
        <div>
          <strong>{{ $t('poivelle.guide.stepMaster') }}</strong>
          <p>{{ $t('poivelle.guide.stepMasterBody') }}</p>
        </div>
        <small>{{ masterReady ? $t('poivelle.guide.ready') : $t('poivelle.guide.waiting') }}</small>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, Check, Clapperboard, LoaderCircle, ShieldCheck, Sparkles } from '@lucide/vue';
import type {
  IPoivelleArtifact,
  IPoivelleGraphNode,
  IPoivelleGraphSnapshot,
  IPoivelleSelection,
  IPoivelleTVCStoryboard,
  IPoivelleTake
} from '@/models';
import { t } from '@/i18n';

const props = defineProps<{
  projectTitle: string;
  graph: IPoivelleGraphSnapshot;
  storyboard?: IPoivelleTVCStoryboard;
  artifacts: IPoivelleArtifact[];
  takes: IPoivelleTake[];
  selections: IPoivelleSelection[];
  canEdit: boolean;
  busy: boolean;
}>();

defineEmits<{
  'generate-node': [nodeId: string];
  'open-storyboard': [];
}>();

const imageNodeIds = computed(() =>
  props.storyboard
    ? props.storyboard.sections.flatMap((section) => section.shots.flatMap((shot) => shot.image_node_ids))
    : props.graph.nodes.filter((node) => node.node_type === 'image').map((node) => node.id)
);
const videoNodeIds = computed(() =>
  props.storyboard
    ? props.storyboard.sections.flatMap((section) => section.shots.flatMap((shot) => shot.video_node_ids))
    : props.graph.nodes.filter((node) => node.node_type === 'video').map((node) => node.id)
);
const readyNodeIds = computed(
  () =>
    new Set([
      ...props.artifacts
        .filter((artifact) => artifact.state === 'committed')
        .flatMap((artifact) => artifact.node_id ?? []),
      ...props.takes.filter((take) => take.state === 'ready').map((take) => take.target_node_id)
    ])
);
const imageReady = computed(() => imageNodeIds.value.filter((nodeId) => readyNodeIds.value.has(nodeId)).length);
const videoReady = computed(() => videoNodeIds.value.filter((nodeId) => readyNodeIds.value.has(nodeId)).length);
const selectedNodeIds = computed(() => new Set(props.selections.map((selection) => selection.target_node_id)));
const imageSelected = computed(() => imageNodeIds.value.filter((nodeId) => selectedNodeIds.value.has(nodeId)).length);
const videoSelected = computed(() => videoNodeIds.value.filter((nodeId) => selectedNodeIds.value.has(nodeId)).length);
const needsSelection = computed(
  () =>
    (imageReady.value === imageNodeIds.value.length && imageSelected.value < imageNodeIds.value.length) ||
    (videoReady.value === videoNodeIds.value.length && videoSelected.value < videoNodeIds.value.length)
);
const hasOutputNode = computed(() => props.graph.nodes.some((node) => node.node_type === 'output'));
const masterReady = computed(() => {
  const outputIds = new Set(props.graph.nodes.filter((node) => node.node_type === 'output').map((node) => node.id));
  return props.artifacts.some(
    (artifact) => artifact.state === 'committed' && !!artifact.node_id && outputIds.has(artifact.node_id)
  );
});
const nextGenerationNode = computed<IPoivelleGraphNode | undefined>(() => {
  const nextImageId = imageNodeIds.value.find((nodeId) => !readyNodeIds.value.has(nodeId));
  if (nextImageId) return props.graph.nodes.find((node) => node.id === nextImageId);
  if (imageSelected.value < imageNodeIds.value.length) return undefined;
  const nextVideoId = videoNodeIds.value.find((nodeId) => !readyNodeIds.value.has(nodeId));
  if (nextVideoId) return props.graph.nodes.find((node) => node.id === nextVideoId);
  if (videoSelected.value < videoNodeIds.value.length) return undefined;
  return props.graph.nodes.find((node) => node.node_type === 'audio' && !readyNodeIds.value.has(node.id));
});
const shotCount = computed(
  () =>
    (props.storyboard?.sections.reduce((total, section) => total + section.shots.length, 0) ??
      props.graph.nodes.filter((node) => node.node_type === 'shot').length) ||
    videoNodeIds.value.length
);
const durationSeconds = computed(() => {
  const script = props.graph.nodes.find((node) => node.node_type === 'script');
  const scriptedDuration = Number(script?.payload?.target_duration_seconds);
  return props.storyboard?.target_duration_seconds ?? (Number.isFinite(scriptedDuration) ? scriptedDuration : 40);
});
const aspectRatio = computed(() => {
  const script = props.graph.nodes.find((node) => node.node_type === 'script');
  return String(script?.payload?.aspect_ratio ?? '16:9');
});
const nextActionLabel = computed(() => {
  if (nextGenerationNode.value?.node_type === 'image') {
    return t('poivelle.guide.generateFrame', { current: imageReady.value + 1, total: imageNodeIds.value.length });
  }
  if (nextGenerationNode.value?.node_type === 'video') {
    return t('poivelle.guide.generateMotion', { current: videoReady.value + 1, total: videoNodeIds.value.length });
  }
  return t('poivelle.guide.generateScore');
});
</script>

<style scoped>
.project-guide {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
  gap: 44px;
  width: min(1080px, calc(100% - 48px));
  margin: 0 auto;
  padding: 54px 0 70px;
}
.guide-copy > p:first-child {
  margin: 0;
  color: var(--app-brand-hex);
  font-size: 11px;
  font-weight: 750;
}
.guide-copy h1 {
  max-width: 620px;
  margin: 10px 0 14px;
  font-size: 36px;
  font-weight: 690;
  line-height: 1.12;
  letter-spacing: 0;
}
.guide-body {
  max-width: 600px;
  margin: 0;
  color: var(--poivelle-muted);
  font-size: 13px;
  line-height: 1.7;
}
.project-facts {
  display: flex;
  gap: 34px;
  margin: 26px 0;
}
.project-facts div {
  display: grid;
  gap: 4px;
}
.project-facts dt {
  color: var(--poivelle-muted);
  font-size: 9px;
}
.project-facts dd {
  margin: 0;
  font-size: 16px;
  font-weight: 720;
}
.guide-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}
.guide-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  gap: 8px;
  padding: 0 15px;
  border-radius: var(--poivelle-radius-small);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.primary-action {
  border: 1px solid var(--app-brand-hex);
  color: white;
  background: var(--app-brand-hex);
}
.secondary-action {
  border: 1px solid var(--poivelle-line-strong);
  color: var(--poivelle-ink);
  background: var(--poivelle-paper);
}
.guide-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cost-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 13px 0 0;
  color: var(--poivelle-muted);
  font-size: 10px;
}
.production-steps {
  display: grid;
  align-self: start;
  gap: 0;
  margin: 0;
  padding: 6px 0;
  list-style: none;
}
.production-steps li {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 74px;
  padding: 10px 0 12px;
}
.production-steps li:not(:last-child)::after {
  position: absolute;
  top: 44px;
  bottom: -8px;
  left: 16px;
  width: 1px;
  background: var(--poivelle-line-strong);
  content: '';
}
.production-steps li > span {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--poivelle-line-strong);
  border-radius: 50%;
  color: var(--poivelle-muted);
  background: var(--poivelle-paper);
  font-size: 10px;
  font-weight: 750;
  z-index: 1;
}
.production-steps li.current > span {
  border-color: var(--app-brand-hex);
  color: white;
  background: var(--app-brand-hex);
  box-shadow: 0 0 0 4px rgba(var(--app-brand-rgb), 0.1);
}
.production-steps li.done > span {
  border-color: var(--el-color-success);
  color: white;
  background: var(--el-color-success);
}
.production-steps strong {
  display: block;
  font-size: 12px;
}
.production-steps p {
  margin: 4px 0 7px;
  color: var(--poivelle-muted);
  font-size: 10px;
  line-height: 1.4;
}
.production-steps small {
  color: var(--poivelle-muted);
  font-size: 9px;
  white-space: nowrap;
}
.production-steps progress {
  display: block;
  width: min(220px, 100%);
  height: 4px;
  border: 0;
  border-radius: 4px;
  appearance: none;
}
.production-steps progress::-webkit-progress-bar {
  border-radius: 4px;
  background: var(--poivelle-line);
}
.production-steps progress::-webkit-progress-value {
  border-radius: 4px;
  background: var(--app-brand-hex);
}
.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 900px) {
  .project-guide {
    grid-template-columns: 1fr;
    gap: 30px;
    padding-top: 34px;
  }
}
@media (max-width: 640px) {
  .project-guide {
    width: calc(100% - 28px);
    padding: 28px 0 44px;
  }
  .guide-copy h1 {
    font-size: 28px;
  }
  .project-facts {
    gap: 22px;
  }
  .guide-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .guide-actions button {
    width: 100%;
  }
}
</style>
