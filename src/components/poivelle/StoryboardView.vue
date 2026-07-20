<template>
  <div class="storyboard-view">
    <header v-if="storyboard" class="storyboard-heading">
      <div>
        <span>{{ storyboard.schema_ref }}</span>
        <h2>{{ storyboard.title }}</h2>
      </div>
      <dl>
        <div>
          <dt>{{ $t('poivelle.storyboard.product') }}</dt>
          <dd>{{ storyboard.product_name }}</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.storyboard.duration') }}</dt>
          <dd>{{ storyboard.target_duration_seconds }}s</dd>
        </div>
        <div>
          <dt>{{ $t('poivelle.storyboard.shots') }}</dt>
          <dd>{{ shotCount }}</dd>
        </div>
      </dl>
    </header>

    <template v-if="storyboard">
      <section v-for="section in storyboard.sections" :key="section.id" class="story-section">
        <div class="section-label">
          <span>{{ String(section.order).padStart(2, '0') }}</span>
          <h3>{{ section.title }}</h3>
        </div>
        <article
          v-for="shot in section.shots"
          :key="shot.row.id"
          :class="['shot-row', { selected: shot.shot_node_id === selectedNodeId }]"
        >
          <button class="shot-brief" type="button" @click="$emit('select-node', shot.shot_node_id)">
            <span class="shot-number">SHOT {{ String(shot.row.shot_number).padStart(2, '0') }}</span>
            <strong>{{ shot.row.plot_description }}</strong>
            <span>{{ shot.row.duration_seconds }}s · {{ shot.row.shot_size }}</span>
          </button>

          <div class="shot-production">
            <dl class="shot-metadata">
              <div>
                <dt>{{ $t('poivelle.storyboard.action') }}</dt>
                <dd>{{ shot.row.character_action || '—' }}</dd>
              </div>
              <div>
                <dt>{{ $t('poivelle.storyboard.emotion') }}</dt>
                <dd>{{ shot.row.emotion || '—' }}</dd>
              </div>
              <div>
                <dt>{{ $t('poivelle.storyboard.lighting') }}</dt>
                <dd>{{ shot.row.lighting_and_atmosphere }}</dd>
              </div>
              <div>
                <dt>{{ $t('poivelle.storyboard.audio') }}</dt>
                <dd>{{ shot.row.audio_effects }}</dd>
              </div>
            </dl>
            <div class="prompt-columns">
              <div>
                <span>{{ $t('poivelle.storyboard.imagePrompt') }}</span>
                <p>{{ shot.row.image_generation_prompt }}</p>
              </div>
              <div>
                <span>{{ $t('poivelle.storyboard.motionPrompt') }}</span>
                <p>{{ shot.row.video_motion_prompt }}</p>
              </div>
            </div>
          </div>

          <div class="candidate-columns">
            <media-lane
              :title="$t('poivelle.storyboard.frames')"
              kind="image"
              :node-ids="shot.image_node_ids"
              :artifacts="artifacts"
              :takes="takes"
              :selections="selections"
              :can-edit="canEdit"
              :can-select="canSelect"
              @select-node="$emit('select-node', $event)"
              @select-take="$emit('select-take', $event)"
            />
            <media-lane
              :title="$t('poivelle.storyboard.motion')"
              kind="video"
              :node-ids="shot.video_node_ids"
              :artifacts="artifacts"
              :takes="takes"
              :selections="selections"
              :can-edit="canEdit"
              :can-select="canSelect"
              @select-node="$emit('select-node', $event)"
              @select-take="$emit('select-take', $event)"
            />
          </div>
        </article>
      </section>
    </template>

    <template v-else>
      <button
        v-for="(node, index) in legacyNodes"
        :key="node.id"
        type="button"
        :class="['legacy-card', { selected: node.id === selectedNodeId }]"
        @click="$emit('select-node', node.id)"
      >
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <Clapperboard :size="26" stroke-width="1.25" aria-hidden="true" />
        <strong>{{ node.title }}</strong>
      </button>
      <div v-if="!legacyNodes.length" class="empty-view">
        <Clapperboard :size="30" stroke-width="1.4" />
        <h2>{{ $t('poivelle.storyboard.emptyTitle') }}</h2>
        <p>{{ $t('poivelle.storyboard.emptyBody') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clapperboard } from '@lucide/vue';
import type {
  IPoivelleArtifact,
  IPoivelleGraphSnapshot,
  IPoivelleSelection,
  IPoivelleTake,
  IPoivelleTVCStoryboard
} from '@/models';
import MediaLane from './StoryboardMediaLane.vue';

const props = defineProps<{
  graph: IPoivelleGraphSnapshot;
  storyboard?: IPoivelleTVCStoryboard;
  artifacts: IPoivelleArtifact[];
  takes: IPoivelleTake[];
  selections: IPoivelleSelection[];
  selectedNodeId?: string;
  canEdit: boolean;
  canSelect: boolean;
}>();
defineEmits<{
  'select-node': [nodeId: string];
  'select-take': [payload: { target_node_id: string; take_id: string }];
}>();
const shotCount = computed(
  () => props.storyboard?.sections.reduce((total, section) => total + section.shots.length, 0) ?? 0
);
const legacyNodes = computed(() =>
  props.graph.nodes.filter((node) => ['storyboard', 'scene', 'shot', 'image', 'video'].includes(node.node_type))
);
</script>

<style scoped>
.storyboard-view {
  height: 100%;
  padding: 20px;
  overflow: auto;
  background: var(--poivelle-canvas);
}
.storyboard-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
  padding: 18px 20px;
  border: 1px solid var(--poivelle-line);
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
  box-shadow: var(--app-shadow-xs);
}
.storyboard-heading span,
.shot-number,
dt,
.prompt-columns span {
  color: var(--poivelle-muted);
  font-size: 9px;
}
.storyboard-heading h2 {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 650;
}
.storyboard-heading dl {
  display: flex;
  gap: 22px;
  margin: 0;
}
.storyboard-heading dl div {
  display: grid;
  gap: 3px;
}
.storyboard-heading dd {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}
.story-section {
  margin-top: 14px;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
}
.section-label span {
  color: var(--app-brand-hex);
  font-size: 10px;
}
.section-label h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 650;
}
.shot-row {
  display: grid;
  grid-template-columns: 210px minmax(280px, 0.9fr) minmax(430px, 1.25fr);
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid var(--poivelle-line);
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
  box-shadow: var(--app-shadow-xs);
}
.shot-row.selected {
  border-color: color-mix(in srgb, var(--app-brand-hex) 45%, var(--poivelle-line));
  box-shadow:
    inset 3px 0 0 var(--app-brand-hex),
    var(--app-shadow-sm);
}
.shot-brief {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 14px;
  border: 0;
  border-right: 1px solid var(--poivelle-line);
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.shot-brief strong {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}
.shot-brief > span:last-child {
  color: var(--poivelle-muted);
  font-size: 10px;
}
.shot-brief:focus-visible,
.legacy-card:focus-visible {
  outline: 2px solid var(--app-brand-hex);
  outline-offset: 2px;
}
.shot-production {
  min-width: 0;
  padding: 12px;
  border-right: 1px solid var(--poivelle-line);
}
.shot-metadata {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 0 12px;
}
.shot-metadata div {
  min-width: 0;
}
.shot-metadata dd {
  margin: 3px 0 0;
  font-size: 10px;
  line-height: 1.4;
}
.prompt-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.prompt-columns div {
  min-width: 0;
  padding: 8px;
  border-radius: var(--poivelle-radius-small);
  background: var(--app-bg-section);
}
.prompt-columns p {
  margin: 4px 0 0;
  color: var(--poivelle-muted);
  font-size: 9px;
  line-height: 1.45;
}
.candidate-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-width: 0;
}
.legacy-card {
  display: inline-grid;
  width: 220px;
  min-height: 130px;
  margin: 7px;
  place-content: center;
  justify-items: center;
  gap: 8px;
  border: 1px solid var(--poivelle-line-strong);
  border-radius: var(--poivelle-radius);
  background: var(--poivelle-paper);
  cursor: pointer;
}
.legacy-card.selected {
  border-color: var(--app-brand-hex);
}
.legacy-card span {
  color: var(--app-brand-hex);
  font-size: 10px;
}
.empty-view {
  display: grid;
  min-height: 340px;
  place-content: center;
  justify-items: center;
  color: var(--poivelle-muted);
  text-align: center;
}
.empty-view h2 {
  margin: 12px 0 5px;
  color: var(--poivelle-ink);
  font-size: 22px;
  font-weight: 650;
}
.empty-view p {
  margin: 0;
  font-size: 11px;
}
@media (max-width: 1100px) {
  .shot-row {
    grid-template-columns: 180px minmax(250px, 1fr);
  }
  .candidate-columns {
    grid-column: 1 / -1;
    border-top: 1px solid var(--poivelle-line);
  }
}
@media (max-width: 767px) {
  .storyboard-view {
    min-width: 0;
    padding: 12px;
  }
  .storyboard-heading {
    align-items: start;
    flex-direction: column;
  }
  .storyboard-heading h2 {
    font-size: 21px;
    overflow-wrap: anywhere;
  }
  .storyboard-heading dl {
    width: 100%;
    justify-content: space-between;
    gap: 10px;
  }
  .shot-row {
    display: block;
    margin-bottom: 12px;
    border: 1px solid var(--poivelle-line);
  }
  .shot-brief {
    border-right: 0;
    border-bottom: 1px solid var(--poivelle-line);
  }
  .shot-production {
    border-right: 0;
    border-bottom: 1px solid var(--poivelle-line);
  }
  .prompt-columns {
    grid-template-columns: 1fr;
  }
  .candidate-columns {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
