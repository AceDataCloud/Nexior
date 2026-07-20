<template>
  <aside class="production-rail">
    <div class="rail-section">
      <div class="section-heading">
        <span>{{ $t('poivelle.section.projects') }}</span>
        <button v-if="canEdit" type="button" :title="$t('poivelle.project.create')" @click="$emit('create-project')">
          <Plus :size="15" aria-hidden="true" />
        </button>
      </div>
      <div class="project-list">
        <button
          v-for="project in projects"
          :key="project.id"
          type="button"
          :class="['project-row', { active: project.id === currentProjectId }]"
          @click="$emit('select-project', project.id)"
        >
          <Clapperboard :size="15" aria-hidden="true" />
          <span>{{ project.title }}</span>
          <small>v{{ project.graph_version }}</small>
        </button>
        <p v-if="!projects.length" class="empty-copy">{{ $t('poivelle.project.empty') }}</p>
      </div>
    </div>

    <div class="rail-section assets-section">
      <div class="section-heading">
        <span>{{ $t('poivelle.section.assets') }}</span>
        <button v-if="canEdit" type="button" :title="$t('poivelle.asset.import')" @click="$emit('import-asset')">
          <Upload :size="15" aria-hidden="true" />
        </button>
      </div>
      <div class="asset-filters">
        <button
          v-for="filter in assetFilters"
          :key="filter"
          type="button"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter === 'all' ? $t('poivelle.asset.all') : filter }}
        </button>
      </div>
      <div class="asset-list">
        <button v-for="asset in visibleAssets" :key="asset.id" type="button" class="asset-row">
          <component :is="assetIcon(asset.kind)" :size="15" aria-hidden="true" />
          <span>
            <strong>{{ asset.title }}</strong>
            <small>{{ asset.kind }} · {{ asset.scope }}</small>
          </span>
        </button>
        <p v-if="!visibleAssets.length" class="empty-copy">{{ $t('poivelle.asset.empty') }}</p>
      </div>
    </div>

    <div class="rail-section compact-section">
      <div class="section-heading static">
        <span>{{ $t('poivelle.section.revisions') }}</span>
        <History :size="14" aria-hidden="true" />
      </div>
      <div class="revision-list">
        <div v-for="revision in revisions.slice(0, 4)" :key="revision.id" class="revision-row">
          <span>R{{ revision.revision_number }}</span>
          <small>Graph v{{ revision.graph_version }}</small>
        </div>
        <p v-if="!revisions.length" class="empty-copy">{{ $t('poivelle.revision.empty') }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { AudioLines, Clapperboard, FileText, History, Image, Plus, Upload, Video } from '@lucide/vue';
import type { IPoivelleAsset, IPoivelleProject, IPoivelleRevision } from '@/models';

const props = defineProps<{
  projects: IPoivelleProject[];
  currentProjectId?: string;
  assets: IPoivelleAsset[];
  revisions: IPoivelleRevision[];
  canEdit: boolean;
}>();

defineEmits<{
  'select-project': [projectId: string];
  'create-project': [];
  'import-asset': [];
}>();

const assetFilters = ['all', 'character', 'location', 'image', 'video', 'voice'];
const activeFilter = ref('all');
const visibleAssets = computed(() =>
  activeFilter.value === 'all' ? props.assets : props.assets.filter((asset) => asset.kind === activeFilter.value)
);
const assetIcon = (kind: string): Component => {
  if (kind === 'video') return Video;
  if (kind === 'voice' || kind === 'music' || kind === 'sfx') return AudioLines;
  if (kind === 'script' || kind === 'brand') return FileText;
  return Image;
};
</script>

<style scoped>
.production-rail {
  display: flex;
  flex-direction: column;
  width: 236px;
  min-width: 236px;
  min-height: 0;
  border-right: 1px solid var(--poivelle-line);
  background: var(--poivelle-paper);
  overflow-y: auto;
}

.rail-section {
  padding: 12px 10px;
  border-bottom: 1px solid var(--poivelle-line);
}

.assets-section {
  flex: 1;
  min-height: 180px;
}

.section-heading,
.section-heading button,
.project-row,
.asset-row,
.revision-row {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  height: 28px;
  padding: 0 5px;
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading button {
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.project-list,
.asset-list,
.revision-list {
  display: grid;
  gap: 3px;
}

.project-row,
.asset-row {
  width: 100%;
  min-width: 0;
  border: 0;
  color: var(--poivelle-ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.project-row {
  height: 34px;
  gap: 8px;
  padding: 0 7px;
  font: inherit;
  font-size: 12px;
}

.project-row.active {
  background: var(--poivelle-mint);
  font-weight: 700;
}

.project-row span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-row small,
.revision-row small {
  color: var(--poivelle-muted);
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

.asset-filters {
  display: flex;
  gap: 4px;
  padding: 5px 4px 10px;
  overflow-x: auto;
}

.asset-filters button {
  padding: 3px 7px;
  border: 1px solid var(--poivelle-line);
  color: var(--poivelle-muted);
  background: transparent;
  font: inherit;
  font-size: 9px;
  text-transform: uppercase;
  cursor: pointer;
}

.asset-filters button.active {
  border-color: var(--poivelle-ink);
  color: var(--poivelle-paper);
  background: var(--poivelle-ink);
}

.asset-row {
  min-height: 42px;
  gap: 9px;
  padding: 6px 7px;
}

.asset-row:hover,
.project-row:hover {
  background: var(--poivelle-hover);
}

.asset-row > span {
  display: grid;
  min-width: 0;
}

.asset-row strong {
  overflow: hidden;
  font-size: 11px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-row small {
  color: var(--poivelle-muted);
  font-size: 9px;
  text-transform: uppercase;
}

.revision-row {
  justify-content: space-between;
  height: 28px;
  padding: 0 6px;
  font-size: 11px;
}

.empty-copy {
  margin: 8px 6px;
  color: var(--poivelle-muted);
  font-size: 11px;
  line-height: 1.45;
}

@media (max-width: 1020px) {
  .production-rail {
    width: 204px;
    min-width: 204px;
  }
}

@media (max-width: 767px) {
  .production-rail {
    display: none;
  }
}
</style>
