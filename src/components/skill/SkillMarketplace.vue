<template>
  <section class="marketplace" :class="{ compact }">
    <header class="market-hero">
      <div>
        <span class="eyebrow">{{ $t('skill.marketplace.eyebrow') }}</span>
        <h2>{{ $t('skill.marketplace.title') }}</h2>
        <p>{{ $t('skill.marketplace.description') }}</p>
      </div>
      <span class="hero-symbol" aria-hidden="true"><marketplace-icon :size="38" /></span>
    </header>

    <div class="market-sources" :aria-label="$t('skill.marketplace.sources')">
      <button
        v-for="source in sourceCards"
        :key="source.key"
        type="button"
        class="source-card"
        :class="[source.key, { active: selectedSource === source.key }]"
        :aria-pressed="selectedSource === source.key"
        @click="selectSource(source.key)"
      >
        <span class="source-mark" aria-hidden="true">{{
          source.key === 'catalog' ? 'A' : source.key === 'skills-sh' ? '▲' : 'S'
        }}</span>
        <span class="source-copy"
          ><strong>{{ source.name }}</strong
          ><span>{{ $t(`skill.marketplace.source.${source.key}`) }}</span></span
        >
      </button>
    </div>

    <div class="market-toolbar">
      <form class="market-search" @submit.prevent="resetAndLoad">
        <el-input
          v-model="query"
          clearable
          :placeholder="$t('skill.marketplace.search')"
          :aria-label="$t('skill.marketplace.search')"
          @clear="resetAndLoad"
        >
          <template #prefix><search-icon :size="16" aria-hidden="true" /></template>
        </el-input>
        <el-button native-type="submit">{{ $t('skill.marketplace.searchButton') }}</el-button>
      </form>
      <el-select
        v-if="selectedSource === 'catalog'"
        v-model="namespace"
        clearable
        class="market-sort"
        :placeholder="$t('skill.directory.allPublishers')"
        :aria-label="$t('skill.directory.allPublishers')"
        @change="resetAndLoad"
      >
        <el-option
          v-for="publisher in publishers"
          :key="publisher.namespace"
          :label="publisher.label"
          :value="publisher.namespace"
        />
      </el-select>
      <el-select
        v-if="selectedSource !== 'skills-sh'"
        v-model="sort"
        class="market-sort"
        :aria-label="$t('skill.marketplace.sort')"
        @change="resetAndLoad"
      >
        <el-option
          :label="
            $t(selectedSource === 'catalog' ? 'skill.marketplace.popularLocal' : 'skill.marketplace.popularExternal')
          "
          value="popular"
        />
        <el-option
          :label="$t(selectedSource === 'catalog' ? 'skill.marketplace.discovered' : 'skill.marketplace.updated')"
          value="recent"
        />
      </el-select>
    </div>
    <div v-if="selectedSource === 'skills-sh'" class="market-collections">
      <filter-chip
        v-for="value in ['trending', 'hot', 'official', '']"
        :key="value"
        :selected="collection === value"
        @click="selectCollection(value)"
        >{{ $t(`skill.marketplace.collection.${value || 'all'}`) }}</filter-chip
      >
    </div>
    <div class="market-summary">
      <span v-if="selectedSource === 'catalog'">{{ $t('skill.marketplace.results', { count: total }) }}</span>
      <a :href="sourceDefaults[selectedSource].url" target="_blank" rel="noopener noreferrer"
        >{{ $t('skill.marketplace.visit') }} ↗</a
      >
    </div>
    <div v-if="loadError === 'not_configured'" class="market-empty">
      <marketplace-icon :size="32" aria-hidden="true" />
      <h3>{{ $t('skill.marketplace.notConnected') }}</h3>
      <p>{{ $t('skill.marketplace.notConnectedHint') }}</p>
    </div>
    <div v-else-if="loadError" class="market-empty" role="alert">
      <p>{{ $t('skill.directory.loadFailed') }}</p>
      <el-button @click="load">{{ $t('skill.marketplace.retry') }}</el-button>
    </div>
    <div v-else-if="loading" class="market-grid" aria-busy="true">
      <div v-for="n in 6" :key="n" class="skill-card skeleton"><span /><span /><span /></div>
    </div>
    <div v-else-if="!items.length" class="market-empty">
      <marketplace-icon :size="32" aria-hidden="true" />
      <h3>{{ $t('skill.directory.empty') }}</h3>
      <p>{{ $t('skill.marketplace.emptyHint') }}</p>
    </div>
    <div v-else class="market-grid">
      <article v-for="item in items" :key="item.id" class="skill-card">
        <div class="skill-card-top">
          <span class="publisher-monogram" aria-hidden="true">{{ item.publisher.slice(0, 1).toUpperCase() }}</span
          ><span class="publisher">{{ item.publisher }}</span
          ><meta-tag v-if="item.installed" density="compact" tone="success">{{
            $t('skill.directory.installed')
          }}</meta-tag>
        </div>
        <button type="button" class="skill-title" @click="selectedItem = item">{{ item.name || item.slug }}</button>
        <p class="skill-description">{{ item.description || $t('skill.marketplace.sourceDescription') }}</p>
        <div class="skill-card-footer">
          <span class="skill-metric" :title="metricLabel(item)"
            >{{ formatCount(metricCount(item)) }} <span>{{ metricLabel(item) }}</span></span
          >
          <button
            type="button"
            class="skill-details"
            :aria-label="$t('skill.marketplace.detailsFor', { name: item.name })"
            @click="selectedItem = item"
          >
            {{ $t('skill.marketplace.details') }} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </article>
    </div>
    <el-pagination
      v-if="selectedSource === 'catalog' && total > pageSize"
      class="market-pagination"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      :pager-count="5"
      layout="prev, pager, next"
      @current-change="changePage"
    />

    <el-pagination
      v-if="selectedSource !== 'catalog' && !loadError && (page > 1 || hasMore)"
      class="market-pagination"
      :current-page="page"
      :page-count="hasMore ? page + 1 : page"
      :disabled="loading"
      layout="prev, next"
      @current-change="changePage"
    />

    <el-dialog
      :model-value="!!selectedItem"
      append-to-body
      width="min(760px, 94vw)"
      :title="selectedItem?.name"
      :close-on-click-modal="!installing"
      :show-close="!installing"
      @update:model-value="closeDetail"
    >
      <template v-if="selectedItem">
        <div class="detail-meta">
          <meta-tag>{{ selectedItem.publisher }}</meta-tag
          ><meta-tag>{{
            isCatalog(selectedItem) ? 'AceDataCloud' : sourceDefaults[selectedItem.marketplace as SourceKey]?.name
          }}</meta-tag
          ><meta-tag v-if="isCatalog(selectedItem) && selectedItem.license">{{ selectedItem.license }}</meta-tag>
        </div>
        <p class="detail-description">{{ selectedItem.description }}</p>
        <dl class="detail-facts">
          <div>
            <dt>{{ $t('skill.marketplace.repository') }}</dt>
            <dd>
              <a :href="selectedItem.source_url" target="_blank" rel="noopener noreferrer"
                >{{ selectedItem.source_repo }} ↗</a
              >
            </dd>
          </div>
          <div v-if="isCatalog(selectedItem)">
            <dt>{{ $t('skill.marketplace.synced') }}</dt>
            <dd>{{ formatDate(selectedItem.last_synced_at) }}</dd>
          </div>
          <div v-if="!isCatalog(selectedItem) && selectedItem.upstream_updated_at">
            <dt>{{ $t('skill.marketplace.updated') }}</dt>
            <dd>{{ formatDate(selectedItem.upstream_updated_at) }}</dd>
          </div>
          <div v-if="isCatalog(selectedItem) && restrictedSurfaces(selectedItem).length">
            <dt>{{ $t('skill.directory.surfaceHint') }}</dt>
            <dd>{{ restrictedSurfaces(selectedItem).join(', ') }}</dd>
          </div>
        </dl>
        <vue-markdown
          v-if="isCatalog(selectedItem)"
          class="detail-content"
          :source="selectedItem.content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')"
          sanitize
        />
        <p v-else class="external-note">{{ $t('skill.marketplace.importHint') }}</p>
        <p v-if="installError" class="install-error" role="alert">{{ installError }}</p>
      </template>
      <template #footer>
        <div v-if="selectedItem" class="detail-actions">
          <a
            v-if="!isCatalog(selectedItem)"
            :href="selectedItem.marketplace_url"
            target="_blank"
            rel="noopener noreferrer"
            >{{ $t('skill.marketplace.originalListing') }} ↗</a
          >
          <el-button v-if="selectedItem.installed" disabled>{{ $t('skill.directory.installed') }}</el-button>
          <el-button v-else-if="isCatalog(selectedItem) && !selectedItem.installable" disabled>{{
            $t('skill.directory.notInstallable')
          }}</el-button>
          <el-button
            v-else-if="isCatalog(selectedItem) && !isSurfaceSupported(restrictedSurfaces(selectedItem))"
            disabled
            >{{ $t('skill.directory.surfaceUnavailable') }}</el-button
          >
          <el-button v-else type="primary" :loading="installing" @click="install(selectedItem)">{{
            $t(isCatalog(selectedItem) ? 'skill.directory.install' : 'skill.marketplace.import')
          }}</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import i18n from '@/i18n';
import { ElButton, ElDialog, ElInput, ElMessage, ElOption, ElPagination, ElSelect } from 'element-plus';
import { FilterChip, MetaTag } from '@acedatacloud/core/components';
import { MarketplaceIcon, SearchIcon } from '@acedatacloud/core/icons/components';
import VueMarkdown from '@/components/common/VueMarkdown.vue';
import {
  skillCatalogOperator,
  skillMarketplaceOperator,
  type ISkillCatalogItem,
  type ISkillMarketplaceEntry
} from '@/operators/skill';
import { isSurfaceSupported } from '@/utils/skills/surfaceGate';

const props = defineProps<{ siteId?: string; compact?: boolean }>();
const emit = defineEmits<{ installed: [id: string] }>();
const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params || {});
const locale = computed(() => i18n.global.locale as string);
type SourceKey = 'catalog' | 'skills-sh' | 'skillsmp';
type Item = ISkillCatalogItem | ISkillMarketplaceEntry;
const sourceDefaults = {
  catalog: { name: 'AceDataCloud', url: 'https://studio.acedata.cloud/console/skills' },
  'skills-sh': { name: 'skills.sh', url: 'https://skills.sh' },
  skillsmp: { name: 'SkillsMP', url: 'https://skillsmp.com' }
};
const selectedSource = ref<SourceKey>('catalog');
const sourceCards = (Object.keys(sourceDefaults) as SourceKey[]).map((key) => ({ key, ...sourceDefaults[key] }));
const items = ref<Item[]>([]);
const selectedItem = ref<Item | null>(null);
const query = ref('');
const sort = ref<'popular' | 'recent'>('popular');
const namespace = ref('');
const publishers = ref<{ namespace: string; label: string }[]>([]);
const collection = ref('trending');
const page = ref(1);
const total = ref(0);
const hasMore = ref(false);
const pageSize = 12;
const loading = ref(false);
const installing = ref(false);
const loadError = ref('');
const installError = ref('');
let requestId = 0;
const isCatalog = (item: Item): item is ISkillCatalogItem => 'identifier' in item;
const restrictedSurfaces = (item: ISkillCatalogItem) =>
  Array.isArray(item.frontmatter?.surfaces)
    ? item.frontmatter.surfaces.filter((s): s is string => typeof s === 'string')
    : [];
const metricCount = (item: Item) => (isCatalog(item) ? item.install_count : item.metric_count);
const metricLabel = (item: Item) =>
  t(
    isCatalog(item)
      ? 'skill.marketplace.localInstalls'
      : item.metric === 'stars'
        ? 'skill.marketplace.repoStars'
        : 'skill.marketplace.marketInstalls'
  );
const formatCount = (count: number) =>
  new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 1 }).format(count);
const formatDate = (date: string) =>
  new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
async function loadPublishers() {
  try {
    const { data } = await skillCatalogOperator.categories();
    publishers.value = [
      ...new Map(
        data.namespaces.map((item) => [
          item.namespace,
          { namespace: item.namespace, label: item.publisher || item.namespace }
        ])
      ).values()
    ].sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    /* Search remains available if publisher facets cannot load. */
  }
}
async function load() {
  const id = ++requestId;
  loading.value = true;
  loadError.value = '';
  try {
    const params = {
      namespace: namespace.value || undefined,
      q: query.value.trim() || undefined,
      sort: sort.value,
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      site_id: props.siteId || undefined
    };
    if (selectedSource.value === 'catalog') {
      const { data } = await skillCatalogOperator.list(params);
      if (id !== requestId) return;
      items.value = data.items;
      total.value = data.total;
      hasMore.value = false;
    } else {
      const { data } = await skillMarketplaceOperator.list({
        q: params.q,
        sort: params.sort,
        site_id: params.site_id,
        page: page.value,
        marketplace: selectedSource.value,
        collection: selectedSource.value === 'skills-sh' ? collection.value || 'all-time' : undefined
      });
      if (id !== requestId) return;
      items.value = data.items;
      total.value = 0;
      hasMore.value = data.has_more;
    }
  } catch (error) {
    if (id === requestId) {
      items.value = [];
      total.value = 0;
      hasMore.value = false;
      loadError.value = (error as { response?: { data?: { code?: string } } }).response?.data?.code || 'unavailable';
    }
  } finally {
    if (id === requestId) loading.value = false;
  }
}
function resetAndLoad() {
  page.value = 1;
  void load();
}
function selectSource(key: SourceKey) {
  selectedSource.value = key;
  namespace.value = '';
  query.value = '';
  sort.value = 'popular';
  resetAndLoad();
}
function selectCollection(value: string) {
  collection.value = value;
  resetAndLoad();
}
function changePage(value: number) {
  page.value = value;
  void load();
}
function closeDetail(value: boolean) {
  if (!value && !installing.value) selectedItem.value = null;
}
watch(selectedItem, () => {
  installError.value = '';
});
watch(() => props.siteId, resetAndLoad);
async function install(item: Item) {
  if (installing.value || item.installed) return;
  if (isCatalog(item) && (!item.installable || !isSurfaceSupported(restrictedSurfaces(item)))) return;
  installing.value = true;
  installError.value = '';
  try {
    const { data } = isCatalog(item)
      ? await skillCatalogOperator.install(item.id, props.siteId ? { site_id: props.siteId } : {})
      : await skillMarketplaceOperator.install(item.reference, props.siteId);
    item.installed = true;
    ElMessage.success(t('skill.directory.installSuccess', { name: item.name }));
    emit('installed', data.id);
  } catch (error) {
    const code = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
    installError.value = t(
      code?.startsWith('license') ? 'skill.marketplace.licenseBlocked' : 'skill.marketplace.importFailed'
    );
  } finally {
    installing.value = false;
  }
}
onMounted(() => {
  void loadPublishers();
  void load();
});
</script>

<style scoped>
.marketplace {
  --market-accent: #1d766b;
  min-width: 0;
  color: var(--el-text-color-primary);
  padding-bottom: 24px;
}
.market-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 28px 30px;
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-card, 16px);
  background: var(--el-bg-color);
}
.eyebrow {
  color: var(--market-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.market-hero h2 {
  margin: 8px 0 10px;
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 650;
  letter-spacing: -0.035em;
  line-height: 1.2;
}
.market-hero p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
  max-width: 650px;
}
.hero-symbol {
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 22px;
  color: var(--market-accent);
  background: color-mix(in srgb, var(--market-accent) 9%, transparent);
  transform: rotate(-6deg);
}
.market-sources {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0 24px;
}
.source-card {
  --source-color: #277467;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 17px 16px;
  text-align: left;
  background: var(--el-bg-color);
  border: 1px solid var(--app-border-subtle);
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.source-card.skills-sh {
  --source-color: var(--el-text-color-primary);
}
.source-card.skillsmp {
  --source-color: #996124;
}
.source-card.active {
  border-color: var(--source-color);
  background: color-mix(in srgb, var(--source-color) 5%, var(--el-bg-color));
  box-shadow: inset 0 -2px var(--source-color);
}
.source-card:hover {
  border-color: var(--source-color);
}
.source-mark {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--source-color) 10%, transparent);
  color: var(--source-color);
  border-radius: 9px;
  font-size: 21px;
  font-weight: 750;
}
.source-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.source-copy strong {
  font-size: 14px;
}
.source-copy > span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}
.market-toolbar {
  display: flex;
  gap: 12px;
}
.market-search {
  display: flex;
  flex: 1;
  gap: 8px;
}
.market-sort {
  width: 165px;
}
.market-collections {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.market-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0 14px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-wrap: wrap;
}
.market-summary a {
  margin-left: auto;
}
a {
  color: var(--el-text-color-regular);
  text-decoration: none;
}
a:hover {
  color: var(--el-color-primary);
}
.market-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.skill-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  padding: 19px 20px 15px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 12px;
  transition: border-color 0.15s;
}
.skill-card:hover {
  border-color: var(--el-border-color-darker);
}
.skill-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.publisher-monogram {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  background: var(--el-fill-color);
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
}
.publisher {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.skill-title {
  color: inherit;
  border: 0;
  background: none;
  padding: 0;
  text-align: left;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: -0.02em;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.skill-title:hover {
  color: var(--el-color-primary);
}
.skill-description {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
  margin: 9px 0 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 66px;
}
.skill-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid var(--app-border-subtle);
}
.skill-metric {
  font-size: 12px;
  font-weight: 600;
}
.skill-metric > span {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.skill-details {
  border: none;
  background: none;
  padding: 3px 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.skill-details:hover {
  color: var(--el-color-primary);
}
.market-empty {
  min-height: 240px;
  padding: 42px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.market-empty h3 {
  color: var(--el-text-color-primary);
  font-size: 18px;
  margin: 0;
}
.market-empty p {
  margin: 0;
  max-width: 450px;
  font-size: 13px;
  line-height: 1.7;
}
.market-pagination {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  justify-content: center;
}
.skeleton {
  min-height: 218px;
  gap: 18px;
}
.skeleton span {
  height: 16px;
  background: var(--el-fill-color);
  border-radius: 4px;
}
.skeleton span:first-child {
  width: 40%;
}
.skeleton span:last-child {
  height: 60px;
}
.detail-meta,
.detail-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.detail-actions {
  justify-content: flex-end;
}
.detail-actions a {
  margin-right: auto;
  font-size: 13px;
}
.detail-description {
  font-size: 14px;
  line-height: 1.7;
  margin: 18px 0;
}
.detail-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0;
  padding: 18px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  font-size: 12px;
}
.detail-facts dt {
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}
.detail-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.detail-content {
  max-height: 45vh;
  overflow: auto;
  font-size: 14px;
  line-height: 1.7;
}
.detail-content :deep(pre) {
  overflow-x: auto;
  background: var(--el-fill-color);
  padding: 12px;
  border-radius: 6px;
}
.detail-content :deep(h1),
.detail-content :deep(h2),
.detail-content :deep(h3) {
  margin: 16px 0 8px;
}
.external-note {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
.install-error {
  color: var(--el-color-danger);
}
.compact .market-hero {
  padding: 20px;
}
.compact .market-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 4px;
}
@media (max-width: 1100px) {
  .market-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 680px) {
  .market-hero {
    padding: 22px 20px;
  }
  .hero-symbol {
    display: none;
  }
  .market-sources {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 14px 0 18px;
  }
  .source-card {
    padding: 12px;
  }
  .source-copy {
    gap: 2px;
  }
  .market-toolbar {
    flex-wrap: wrap;
  }
  .market-search {
    flex-basis: 100%;
  }
  .market-sort {
    width: 100%;
  }
  .market-grid,
  .compact .market-grid {
    grid-template-columns: 1fr;
  }
  .market-summary {
    gap: 8px;
  }
  .market-summary a {
    margin-left: 0;
  }
  .detail-facts {
    grid-template-columns: 1fr;
  }
}
</style>
