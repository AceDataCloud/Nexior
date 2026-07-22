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
  width: 248px;
  min-width: 248px;
  min-height: 0;
  border-right: 1px solid var(--poivelle-line);
  background: var(--app-sidebar-bg);
  overflow-y: auto;
}

.rail-section {
  padding: 14px 12px;
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
  min-height: 44px;
  padding: 0 5px;
  color: var(--poivelle-muted);
  font-size: 11px;
  font-weight: 650;
}

.section-heading button {
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--poivelle-radius-small);
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.project-list,
.asset-list,
.revision-list {
  display: grid;
  gap: 5px;
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
  min-height: 44px;
  gap: 8px;
  padding: 0 9px;
  border-radius: var(--poivelle-radius-small);
  font: inherit;
  font-size: 12px;
}

.project-row.active {
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-hover);
  font-weight: 700;
  box-shadow: inset 3px 0 0 var(--app-brand-hex);
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
  border-radius: var(--adc-radius-full);
  color: var(--poivelle-muted);
  background: transparent;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}

.asset-filters button.active {
  border-color: var(--app-brand-hex);
  color: var(--app-brand-hex-dark-2);
  background: var(--poivelle-hover);
}

.asset-row {
  min-height: 44px;
  gap: 9px;
  padding: 6px 7px;
  border-radius: var(--poivelle-radius-small);
}

.asset-row:hover,
.project-row:hover {
  background: var(--poivelle-hover);
}

.section-heading button:hover {
  color: var(--app-brand-hex);
  background: var(--poivelle-hover);
}

.section-heading button:focus-visible,
.project-row:focus-visible,
.asset-filters button:focus-visible,
.asset-row:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--app-brand-hex) 38%, transparent);
  outline-offset: 2px;
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
