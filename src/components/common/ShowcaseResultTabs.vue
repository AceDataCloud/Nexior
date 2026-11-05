<template>
  <div class="showcase-result-shell" :class="{ 'has-task-actions': $slots['task-actions'] && activeTab === 'tasks' }">
    <div class="result-header-line" aria-hidden="true" />
    <el-tabs v-model="activeTab" class="showcase-result-tabs">
      <el-tab-pane :label="$t('intro.serviceGallery.currentTasks')" name="tasks" class="result-pane tasks-pane">
        <slot name="tasks" />
      </el-tab-pane>
      <el-tab-pane :label="$t('intro.serviceGallery.gallery')" name="gallery" class="result-pane gallery-pane">
        <div v-if="loading" class="gallery-state" role="status">{{ $t('intro.serviceGallery.loading') }}</div>
        <div v-else-if="error" class="gallery-state error" role="alert">
          <span>{{ $t('intro.serviceGallery.loadFailed') }}</span>
          <el-button link type="primary" @click="load">{{ $t('intro.serviceGallery.retry') }}</el-button>
        </div>
        <showcase-grid
          v-else-if="resolvedItems.length"
          :items="resolvedItems"
          :show-capability="false"
          compact
          masonry
          detail-preview
          @select="selectedItem = $event"
          @icon-error="$emit('icon-error', $event)"
        />
        <div v-else class="gallery-state">{{ $t('intro.serviceGallery.empty') }}</div>
      </el-tab-pane>
    </el-tabs>
    <div v-if="$slots['task-actions'] && activeTab === 'tasks'" class="task-actions">
      <slot name="task-actions" />
    </div>
  </div>
  <showcase-detail-dialog :item="selectedItem" @close="selectedItem = undefined" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { ElButton, ElTabPane, ElTabs } from 'element-plus';
import type { IShowcase, ResolvedShowcase } from '@/models';
import { showcaseOperator } from '@/operators';
import { resolveShowcase } from '@/utils/showcase';
import ShowcaseDetailDialog from '@/components/showcase/ShowcaseDetailDialog.vue';
import ShowcaseGrid from './ShowcaseGrid.vue';

const props = defineProps<{ service: string }>();
defineEmits<{ 'icon-error': [item: ResolvedShowcase] }>();

const store = useStore();
const { locale } = useI18n();
const activeTab = ref<'tasks' | 'gallery'>('tasks');
const items = ref<IShowcase[]>([]);
const loading = ref(false);
const error = ref(false);
const loaded = ref(false);
const selectedItem = ref<ResolvedShowcase>();
let loadGeneration = 0;

const resolvedItems = computed(() =>
  items.value
    .filter((item) => item.service === props.service)
    .map((item) => resolveShowcase(item, store.state.site))
    .filter((item): item is ResolvedShowcase => Boolean(item))
);

async function load(): Promise<void> {
  const generation = ++loadGeneration;
  const requestLocale = locale.value;
  loading.value = true;
  error.value = false;
  items.value = [];
  selectedItem.value = undefined;
  try {
    const response = await showcaseOperator.list(props.service, requestLocale);
    if (generation === loadGeneration && locale.value === requestLocale) {
      items.value = response.data;
      loaded.value = true;
    }
  } catch {
    if (generation === loadGeneration) error.value = true;
  } finally {
    if (generation === loadGeneration) loading.value = false;
  }
}

watch(activeTab, (name) => {
  if (name === 'gallery' && !loaded.value) void load();
});
watch(locale, () => {
  if (loaded.value || activeTab.value === 'gallery') void load();
});

defineExpose({ activeTab, resolvedItems, loading, error, loaded, selectedItem, load });
</script>

<style lang="scss" scoped>
.showcase-result-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto minmax(0, 1fr);
  container-type: inline-size;
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.showcase-result-shell.has-task-actions {
  grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
}

.result-header-line {
  grid-column: 1 / -1;
  grid-row: 1;
  align-self: end;
  height: 2px;
  margin: 0 12px;
  background: var(--el-border-color-light);
  pointer-events: none;
}

.showcase-result-tabs {
  // Keep the native tab/panel semantics while sharing its header row with actions.
  display: contents;

  :deep(.el-tabs__header) {
    grid-column: 1;
    grid-row: 1;
    height: 40px;
    min-width: 0;
    margin: 0;
    padding: 0 12px;
  }

  // Element Plus's -1px margin offsets the tab baseline from sibling actions.
  :deep(.el-tabs__nav-wrap) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__content) {
    grid-column: 1 / -1;
    grid-row: 3;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.el-tab-pane) {
    min-height: 0;
    flex: 1;
  }
}

.task-actions {
  display: flex;
  grid-column: 2;
  grid-row: 1;
  align-items: center;
  min-height: 40px;
  padding: 0 140px 0 0;
  :deep(.task-history-toolbar) {
    margin: 0;
    align-self: center;
  }
}

// The app's fixed balance badge occupies the far right of the first row.
// Keep history beside the tabs; narrow result panes put the compact controls below it.
@container (max-width: 520px) {
  .showcase-result-tabs :deep(.el-tabs__header) {
    grid-column: 1 / -1;
    padding-right: 140px;
  }
  .task-actions {
    grid-column: 1 / -1;
    grid-row: 2;
    padding: 0 12px;
  }
}

@media (max-width: 600px) {
  .showcase-result-tabs :deep(.el-tabs__item) {
    padding-inline: 10px;
  }
}

.result-pane {
  height: 100%;
}

.tasks-pane {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.gallery-pane {
  overflow-y: auto;
  padding: 18px;
}

.gallery-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  color: var(--el-text-color-secondary);

  &.error {
    align-content: center;
    gap: 8px;
  }
}
</style>
