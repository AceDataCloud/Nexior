<template>
  <el-dialog
    :model-value="modelValue"
    :title="$t('skill.dialog.directoryTitle')"
    width="min(960px, 94vw)"
    align-center
    class="directory-dialog"
    :close-on-click-modal="!installing"
    :show-close="!installing"
    @update:model-value="(v: boolean) => $emit('update:modelValue', v)"
    @open="onOpen"
  >
    <div class="directory">
      <!-- Right pane: list OR detail -->
      <main class="directory-main">
        <template v-if="!selectedItem">
          <header class="directory-header">
            <el-input
              v-model="searchQuery"
              class="directory-search"
              size="default"
              clearable
              :placeholder="$t('skill.directory.searchPlaceholder')"
              @input="onSearchInput"
            >
              <template #prefix>
                <search-icon :size="14" aria-hidden="true" focusable="false" />
              </template>
            </el-input>
            <div class="directory-controls">
              <el-select
                v-model="namespaceFilter"
                class="directory-select"
                :placeholder="$t('skill.directory.allPublishers')"
                clearable
                size="default"
                @change="reloadFromFirstPage"
              >
                <el-option v-for="ns in namespaceOptions" :key="ns.value" :label="ns.label" :value="ns.value" />
              </el-select>
              <el-select
                v-model="sortBy"
                class="directory-select directory-select-sm"
                size="default"
                @change="reloadFromFirstPage"
              >
                <el-option :label="$t('skill.directory.sort.popular')" value="popular" />
                <el-option :label="$t('skill.directory.sort.recent')" value="recent" />
                <el-option :label="$t('skill.directory.sort.name')" value="name" />
              </el-select>
            </div>
          </header>

          <div v-loading="loading" class="directory-grid-wrapper">
            <p v-if="!loading && total === 0" class="directory-empty">
              {{ $t('skill.directory.empty') }}
            </p>
            <div v-else class="directory-grid">
              <article
                v-for="item in items"
                :key="item.id"
                class="directory-card"
                :class="{ 'is-installed': item.installed }"
                @click="openDetail(item)"
              >
                <div class="directory-card-head">
                  <span class="directory-card-title">/{{ item.slug }}</span>
                  <span
                    v-if="item.installed"
                    class="directory-card-action is-installed"
                    :title="$t('skill.directory.installed')"
                  >
                    <success-icon :size="16" aria-hidden="true" focusable="false" />
                  </span>
                  <span
                    v-else-if="item.installable && !canInstallOnSurface(item)"
                    class="directory-card-locked"
                    :title="$t('skill.directory.surfaceBlocked', { platforms: surfaceLabels(item) })"
                  >
                    <lock-icon :size="16" aria-hidden="true" focusable="false" />
                  </span>
                  <button
                    v-else-if="item.installable"
                    class="directory-card-action"
                    :aria-label="$t('skill.directory.install')"
                    :title="$t('skill.directory.install')"
                    @click.stop="onInstall(item)"
                  >
                    <add-icon :size="16" aria-hidden="true" focusable="false" />
                  </button>
                  <span v-else class="directory-card-locked" :title="item.license">
                    <lock-icon :size="16" aria-hidden="true" focusable="false" />
                  </span>
                </div>
                <div class="directory-card-meta">
                  <span class="directory-card-publisher">{{ item.publisher }}</span>
                  <span v-if="item.install_count > 0" class="directory-card-count">
                    <down-icon :size="14" aria-hidden="true" focusable="false" />
                    {{ formatCount(item.install_count) }}
                  </span>
                  <span
                    v-if="surfaceLabels(item)"
                    class="directory-card-surface"
                    :title="$t('skill.directory.surfaceHint')"
                  >
                    {{ surfaceLabels(item) }}
                  </span>
                </div>
                <p class="directory-card-desc">{{ item.description }}</p>
              </article>
            </div>
          </div>

          <footer v-if="total > pageSize" class="directory-footer">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              :pager-count="5"
              background
              layout="prev, pager, next, total"
              @current-change="onPageChange"
            />
          </footer>
        </template>

        <template v-else>
          <header class="directory-detail-head">
            <button class="directory-back-btn" @click="selectedItem = null">
              <back-icon :size="16" aria-hidden="true" focusable="false" />
              {{ $t('skill.directory.back') }}
            </button>
            <div class="directory-detail-actions">
              <a v-if="selectedItem.source_url" :href="selectedItem.source_url" target="_blank" class="directory-link">
                <font-awesome-icon icon="fa-brands fa-github" />
                {{ $t('skill.directory.viewSource') }}
              </a>
              <el-button v-if="selectedItem.installed" disabled type="success" plain>
                <success-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
                {{ $t('skill.directory.installed') }}
              </el-button>
              <el-button
                v-else-if="selectedItem.installable && !canInstallOnSurface(selectedItem)"
                disabled
                :title="$t('skill.directory.surfaceBlocked', { platforms: surfaceLabels(selectedItem) })"
              >
                <lock-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
                {{ $t('skill.directory.surfaceUnavailable') }}
              </el-button>
              <el-button
                v-else-if="selectedItem.installable"
                type="primary"
                :loading="installing"
                @click="onInstall(selectedItem!)"
              >
                <install-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
                {{ $t('skill.directory.install') }}
              </el-button>
              <el-button v-else disabled :title="selectedItem.license">
                <lock-icon class="mr-1" :size="16" aria-hidden="true" focusable="false" />
                {{ selectedItem.license || $t('skill.directory.notInstallable') }}
              </el-button>
            </div>
          </header>
          <div class="directory-detail-body">
            <h2 class="directory-detail-title">/{{ selectedItem.slug }}</h2>
            <div class="directory-detail-meta">
              <span
                ><strong>{{ $t('skill.meta.addedBy') }}:</strong> {{ selectedItem.publisher }}</span
              >
              <span v-if="selectedItem.license"
                ><strong>{{ $t('skill.directory.license') }}:</strong> {{ selectedItem.license }}</span
              >
              <span v-if="selectedItem.version">v{{ selectedItem.version }}</span>
              <span
                v-if="surfaceLabels(selectedItem)"
                class="directory-detail-surface"
                :title="$t('skill.directory.surfaceHint')"
              >
                {{ $t('skill.directory.surfaceOnly', { platforms: surfaceLabels(selectedItem) }) }}
              </span>
            </div>
            <p class="directory-detail-desc">{{ selectedItem.description }}</p>
            <vue-markdown class="directory-detail-content" :source="detailBody" sanitize />
          </div>
        </template>
      </main>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElInput, ElButton, ElMessage, ElPagination, ElSelect, ElOption, vLoading } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  AddIcon,
  BackIcon,
  DownIcon,
  InstallIcon,
  LockIcon,
  SearchIcon,
  SuccessIcon
} from '@acedatacloud/core/icons/components';
import VueMarkdown from '@/components/common/VueMarkdown.vue';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import shell from 'highlight.js/lib/languages/shell';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/github.css';
import { type ISkillCatalogItem, type SkillCatalogSort, skillCatalogOperator } from '@/operators/skill';
import { isSurfaceSupported } from '@/utils/skills/surfaceGate';

// Register a small subset of languages — enough for SKILL.md bodies
// (markdown + yaml + python + shell) without bloating the bundle.
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('python', python);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('yaml', yaml);
hljs.registerAliases(['yml'], { languageName: 'yaml' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['sh', 'zsh'], { languageName: 'bash' });

interface IData {
  loading: boolean;
  installing: boolean;
  items: ISkillCatalogItem[];
  total: number;
  currentPage: number;
  searchQuery: string;
  namespaceFilter: string;
  sortBy: SkillCatalogSort;
  selectedItem: ISkillCatalogItem | null;
  searchTimer: number | null;
  /** All namespaces known to the catalog, fetched once per dialog open
   *  via the facets endpoint so the publisher dropdown stays stable
   *  across pagination (otherwise it would only show namespaces visible
   *  on the current page). */
  knownNamespaces: string[];
  /** namespace → human publisher name. Seeded from items as they load,
   *  so a publisher name is shown once at least one of its skills has
   *  been visited. Misses fall back to the namespace string. */
  publisherByNamespace: Record<string, string>;
}

/** Number of catalog cards rendered per page. Tuned so the grid fits
 *  the dialog body (height ≈ 600px) without scrolling for the typical
 *  card height. */
const PAGE_SIZE = 12;

export default defineComponent({
  name: 'BrowseSkillsDialog',
  components: {
    VueMarkdown,
    ElDialog,
    ElInput,
    ElButton,
    ElPagination,
    ElSelect,
    ElOption,
    FontAwesomeIcon,
    AddIcon,
    BackIcon,
    DownIcon,
    InstallIcon,
    LockIcon,
    SearchIcon,
    SuccessIcon
  },
  directives: { loading: vLoading },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'installed'],
  data(): IData {
    return {
      loading: false,
      installing: false,
      items: [],
      total: 0,
      currentPage: 1,
      searchQuery: '',
      namespaceFilter: '',
      sortBy: 'popular',
      selectedItem: null,
      searchTimer: null,
      knownNamespaces: [],
      publisherByNamespace: {}
    };
  },
  computed: {
    pageSize(): number {
      return PAGE_SIZE;
    },
    namespaceOptions(): { value: string; label: string }[] {
      // Build from the catalog-wide facets (fetched once per open) so
      // every publisher is selectable regardless of which page is
      // currently rendered. Falls back to current-page items when the
      // facets haven't loaded yet.
      const namespaces = new Set<string>(this.knownNamespaces);
      for (const item of this.items) namespaces.add(item.namespace);
      return Array.from(namespaces)
        .sort()
        .map((ns) => ({ value: ns, label: this.publisherForNamespace(ns) }));
    },
    detailBody(): string {
      if (!this.selectedItem) return '';
      // Strip the YAML frontmatter (already rendered above as structured
      // metadata) and hand the body to <vue-markdown sanitize>, which
      // disables raw HTML — this is other people's published content.
      return this.selectedItem.content.replace(/^---\n[\s\S]*?\n---\n?/, '');
    }
  },
  methods: {
    onOpen() {
      this.selectedItem = null;
      this.searchQuery = '';
      this.namespaceFilter = '';
      this.sortBy = 'popular';
      this.currentPage = 1;
      this.knownNamespaces = [];
      this.publisherByNamespace = {};
      // Fire off the facets request in parallel — we don't need to wait
      // for it before showing page 1 of the grid.
      this.loadFacets();
      this.reload();
    },
    openDetail(item: ISkillCatalogItem) {
      this.selectedItem = item;
    },
    async loadFacets() {
      try {
        const { data } = await skillCatalogOperator.categories();
        // Distinct namespaces, ignoring the per-category breakdown.
        const seen = new Set<string>();
        for (const facet of data.namespaces) seen.add(facet.namespace);
        this.knownNamespaces = Array.from(seen).sort();
      } catch (err) {
        // Non-fatal: dropdown silently falls back to namespaces visible
        // on the current page.
        console.warn('failed to load skill catalog facets', err);
      }
    },
    /** Reset to page 1 + reload. Use after any filter/search/sort change. */
    reloadFromFirstPage() {
      this.currentPage = 1;
      this.reload();
    },
    onPageChange(page: number) {
      this.currentPage = page;
      this.reload();
      // Scroll back to the top of the grid so the user sees page N from
      // the top instead of mid-card after Element Plus's default behaviour.
      this.$nextTick(() => {
        const wrapper = this.$el.querySelector('.directory-grid-wrapper') as HTMLElement | null;
        if (wrapper) wrapper.scrollTop = 0;
      });
    },
    onSearchInput() {
      // Debounce 250ms so we don't fire a request per keystroke.
      if (this.searchTimer !== null) window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => {
        this.searchTimer = null;
        this.reloadFromFirstPage();
      }, 250);
    },
    async reload() {
      this.loading = true;
      try {
        const { data } = await skillCatalogOperator.list({
          q: this.searchQuery.trim() || undefined,
          namespace: this.namespaceFilter || undefined,
          sort: this.sortBy,
          limit: this.pageSize,
          offset: (this.currentPage - 1) * this.pageSize
        });
        this.items = data.items;
        this.total = data.total;
        // Cache publisher names so the dropdown can label namespaces
        // even on pages where they're not currently rendered.
        for (const item of data.items) {
          if (item.publisher) this.publisherByNamespace[item.namespace] = item.publisher;
        }
      } catch (err) {
        console.error(err);
        ElMessage.error(this.$t('skill.directory.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    async onInstall(item: ISkillCatalogItem) {
      if (this.installing) return;
      // Defensive: if the server already says it's installed (or we just
      // flipped it from a successful install), don't try again.
      if (item.installed) return;
      // Guard the surface restriction here too, in case a caller bypasses the
      // template gating.
      if (!this.canInstallOnSurface(item)) {
        ElMessage.warning(this.$t('skill.directory.surfaceBlocked', { platforms: this.surfaceLabels(item) }));
        return;
      }
      this.installing = true;
      try {
        const { data } = await skillCatalogOperator.install(item.id);
        ElMessage.success(this.$t('skill.directory.installSuccess', { name: item.slug }));
        this.$emit('installed', data.id);
        // Bump the local state so the card flips to "installed" without a refetch.
        item.installed = true;
        item.install_count += 1;
      } catch (err) {
        const detail = this.extractError(err);
        if (detail.includes('already exists')) {
          // Server-side state was stale (or the user installed the same
          // item under a different slug) — sync the UI to reality.
          item.installed = true;
          ElMessage.warning(this.$t('skill.directory.alreadyInstalled', { name: item.slug }));
        } else {
          ElMessage.error(this.$t('skill.directory.installFailed', { detail }));
        }
      } finally {
        this.installing = false;
      }
    },
    extractError(err: unknown): string {
      const e = err as { response?: { data?: { detail?: string } } };
      return e?.response?.data?.detail || String(err) || 'unknown error';
    },
    formatCount(n: number): string {
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      return String(n);
    },
    publisherForNamespace(ns: string): string {
      // Prefer the cached publisher name (seeded from any item we've
      // ever loaded this session); fall back to the items currently on
      // screen, then finally to the namespace string itself.
      if (this.publisherByNamespace[ns]) return this.publisherByNamespace[ns];
      const item = this.items.find((it) => it.namespace === ns);
      return item ? item.publisher : ns;
    },
    /** Surfaces this skill is restricted to, read from `frontmatter.surfaces`.
     *  Empty = unrestricted (runs on every surface). */
    restrictedSurfaces(item: ISkillCatalogItem): string[] {
      const raw = (item.frontmatter as Record<string, unknown> | undefined)?.surfaces;
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().toLowerCase());
    },
    surfaceLabel(surface: string): string {
      const key = `skill.directory.surface.${surface}`;
      const label = this.$t(key) as string;
      // vue-i18n echoes the key back on a miss — show the raw token instead.
      return label === key ? surface : label;
    },
    /** Joined label (e.g. "macOS 桌面版"), or '' when unrestricted. */
    surfaceLabels(item: ISkillCatalogItem): string {
      return this.restrictedSurfaces(item)
        .map((s) => this.surfaceLabel(s))
        .join(' / ');
    },
    /** Whether this skill's surface restriction is satisfied on the current
     *  surface (always true when unrestricted). */
    canInstallOnSurface(item: ISkillCatalogItem): boolean {
      return isSurfaceSupported(this.restrictedSurfaces(item));
    }
  }
});
</script>

<style scoped>
.directory-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.directory {
  display: flex;
  height: 600px;
}
.directory-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.directory-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
/* Styling comes from the global `.el-input__wrapper` rules in _common.scss,
   so the field matches every other input in the console. */
.directory-search {
  flex: 1;
}
.directory-controls {
  display: flex;
  gap: 8px;
}
.directory-select {
  width: 160px;
}
.directory-select-sm {
  width: 120px;
}
.directory-grid-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
}
.directory-footer {
  display: flex;
  justify-content: center;
  padding: 8px 20px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.directory-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
  margin-top: 60px;
}
.directory-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
/* Global tokens. `--el-card-*` is scoped inside Element Plus's `.el-card`
   rule, so a non-card element never inherits it and falls back to a square
   border-radius and `currentColor` border. */
.directory-card {
  border: 1px solid var(--app-border-subtle);
  border-radius: var(--adc-radius-control);
  padding: 14px 16px;
  background: var(--el-card-bg-color);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
/* A literal black shadow is invisible on the dark background; the token adapts. */
.directory-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--app-shadow-sm);
}
.directory-card.is-installed {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
.directory-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.directory-card-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.directory-card-action {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.directory-card-action:hover {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}
.directory-card-action.is-installed {
  color: var(--el-color-primary);
}
.directory-card-locked {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-disabled);
}
.directory-card-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.directory-card-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.directory-card-surface {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}
.directory-detail-surface {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}
.directory-card-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.directory-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.directory-back-btn {
  border: none;
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.directory-detail-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.directory-link {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}
.directory-link:hover {
  color: var(--el-color-primary);
}
.directory-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
}
.directory-detail-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 22px;
  margin: 0 0 6px;
}
.directory-detail-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.directory-detail-desc {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.55;
  margin-bottom: 18px;
}
.directory-detail-content :deep(h1),
.directory-detail-content :deep(h2),
.directory-detail-content :deep(h3) {
  margin-top: 18px;
  margin-bottom: 10px;
}
.directory-detail-content :deep(pre) {
  background: var(--el-fill-color-lighter);
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
}
.directory-detail-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.directory-detail-content :deep(a) {
  color: var(--el-color-primary);
}
</style>
