<template>
  <div class="artifacts">
    <div class="inner">
      <div class="header">
        <h2 class="title">{{ $t('chat.artifacts.title') }}</h2>
        <el-switch
          v-model="showHidden"
          class="show-hidden"
          :active-text="$t('chat.artifacts.showHidden')"
          @change="onShowHiddenChange"
        />
      </div>

      <div class="filters" role="group" :aria-label="$t('chat.artifacts.title')">
        <button
          v-for="opt in visibleKindFilters"
          :key="opt"
          type="button"
          class="filter-chip"
          :class="{ active: activeKind === opt }"
          :aria-pressed="activeKind === opt"
          @click="onFilter(opt)"
        >
          <span>{{ opt === 'all' ? $t('chat.artifacts.filterAll') : $t('chat.artifacts.kind.' + opt) }}</span>
          <span v-if="summary" class="filter-count">
            {{ opt === 'all' ? summary.total : (summary.by_kind[opt] ?? 0) }}
          </span>
        </button>
      </div>

      <el-skeleton v-if="loading" :rows="4" animated class="loading-block" />

      <el-empty v-else-if="!items.length" :description="$t('chat.artifacts.empty')" class="empty" />

      <template v-else>
        <div class="artifact-list">
          <el-card v-for="item in items" :key="item.id" class="artifact-card" shadow="hover">
            <div class="artifact-body">
              <a
                v-if="item.preview_url"
                :href="item.url || item.preview_url"
                target="_blank"
                rel="noopener noreferrer"
                class="thumb"
              >
                <img :src="item.preview_url" :alt="item.title" />
              </a>
              <div class="artifact-main">
                <div class="artifact-top">
                  <el-tag size="small" round class="kind-tag">{{ $t('chat.artifacts.kind.' + item.kind) }}</el-tag>
                  <el-tag v-if="item.source === 'auto'" size="small" type="info" round class="source-tag">
                    {{ $t('chat.artifacts.sourceAuto') }}
                  </el-tag>
                  <el-tag v-if="item.hidden" size="small" type="warning" round class="hidden-tag">
                    {{ $t('chat.artifacts.hiddenBadge') }}
                  </el-tag>
                  <span v-if="item.channel" class="channel">{{ item.channel }}</span>
                  <span class="time">{{ formatTime(item.created_at) }}</span>
                </div>
                <div class="artifact-title">{{ item.title }}</div>
                <div v-if="item.summary" class="artifact-summary">{{ item.summary }}</div>
                <div class="artifact-actions">
                  <el-button
                    v-if="item.url"
                    size="small"
                    text
                    type="primary"
                    tag="a"
                    :href="item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <external-link-icon class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                    {{ $t('chat.artifacts.open') }}
                  </el-button>
                  <el-button size="small" text @click="onToggleHide(item)">
                    <view-icon
                      v-if="item.hidden"
                      class="icon"
                      :size="'1em' as any"
                      aria-hidden="true"
                      focusable="false"
                    />
                    <view-off-icon v-else class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                    {{ item.hidden ? $t('chat.artifacts.unhide') : $t('chat.artifacts.hide') }}
                  </el-button>
                  <el-button size="small" text type="danger" @click="onDelete(item)">
                    <delete-icon class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
                    {{ $t('chat.artifacts.delete') }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>
        <div v-if="hasMore" class="load-more">
          <el-button round :loading="loadingMore" @click="loadMore">{{ $t('chat.artifacts.loadMore') }}</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { DeleteIcon, ExternalLinkIcon, ViewIcon, ViewOffIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElCard, ElSkeleton, ElEmpty, ElTag, ElSwitch, ElMessage, ElMessageBox } from 'element-plus';
import { artifactsOperator, IArtifact, IArtifactKind } from '@/operators/artifacts';

const PAGE_SIZE = 30;
const KIND_FILTERS: (IArtifactKind | 'all')[] = [
  'all',
  'article',
  'image',
  'video',
  'audio',
  'email',
  'document',
  'message',
  'dataset',
  'link',
  'other'
];

export default defineComponent({
  name: 'Artifacts',
  components: {
    DeleteIcon,
    ElButton,
    ElCard,
    ElSkeleton,
    ElEmpty,
    ElTag,
    ElSwitch,
    ExternalLinkIcon,
    ViewIcon,
    ViewOffIcon
  },
  data() {
    return {
      loading: true,
      loadingMore: false,
      items: [] as IArtifact[],
      count: 0,
      offset: 0,
      activeKind: 'all' as IArtifactKind | 'all',
      showHidden: false,
      summary: null as { total: number; by_kind: Record<string, number> } | null,
      kindFilters: KIND_FILTERS,
      reloadToken: 0,
      summaryReloadToken: 0
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    },
    hasMore(): boolean {
      return this.items.length < this.count;
    },
    visibleKindFilters(): (IArtifactKind | 'all')[] {
      if (!this.summary) return this.kindFilters;
      return this.kindFilters.filter(
        (kind) => kind === 'all' || kind === this.activeKind || (this.summary?.by_kind[kind] ?? 0) > 0
      );
    }
  },
  async mounted() {
    await Promise.all([this.loadSummary(), this.reload()]);
  },
  methods: {
    formatTime(ts: number): string {
      return new Date(ts * 1000).toLocaleString();
    },
    async loadSummary() {
      if (!this.token) return;
      const token = ++this.summaryReloadToken;
      try {
        const summary = await artifactsOperator.summary(this.token, {
          ...(this.showHidden ? { include_hidden: true } : {})
        });
        if (token !== this.summaryReloadToken) return;
        this.summary = summary;
      } catch (e) {
        if (token !== this.summaryReloadToken) return;
        console.error('load artifact summary failed', e);
        this.summary = null;
      }
    },
    async reload() {
      if (!this.token) {
        this.loading = false;
        return;
      }
      this.loading = true;
      this.offset = 0;
      const token = ++this.reloadToken;
      try {
        const { items, count } = await artifactsOperator.list(this.token, {
          ...(this.activeKind !== 'all' ? { kind: this.activeKind } : {}),
          ...(this.showHidden ? { include_hidden: true } : {}),
          offset: 0,
          limit: PAGE_SIZE
        });
        // Drop stale responses when the user toggled filters/switch mid-flight.
        if (token !== this.reloadToken) return;
        this.items = items;
        this.count = count;
        this.offset = items.length;
      } catch (e) {
        if (token !== this.reloadToken) return;
        console.error('load artifacts failed', e);
        this.items = [];
        this.count = 0;
        this.offset = 0;
        ElMessage.error(this.$t('chat.artifacts.loadError'));
      } finally {
        if (token === this.reloadToken) this.loading = false;
      }
    },
    async loadMore() {
      if (!this.token || this.loadingMore) return;
      this.loadingMore = true;
      const token = this.reloadToken;
      try {
        const { items } = await artifactsOperator.list(this.token, {
          ...(this.activeKind !== 'all' ? { kind: this.activeKind } : {}),
          ...(this.showHidden ? { include_hidden: true } : {}),
          offset: this.offset,
          limit: PAGE_SIZE
        });
        // Drop the page if the user changed filters (or hit reload) mid-flight.
        if (token !== this.reloadToken) return;
        this.items.push(...items);
        this.offset += items.length;
      } catch (e) {
        console.error('load more artifacts failed', e);
      } finally {
        this.loadingMore = false;
      }
    },
    onFilter(kind: IArtifactKind | 'all') {
      if (this.activeKind === kind) return;
      this.activeKind = kind;
      this.reload();
    },
    async onShowHiddenChange() {
      await Promise.all([this.loadSummary(), this.reload()]);
    },
    async onToggleHide(item: IArtifact) {
      if (!this.token) return;
      const nextHidden = !item.hidden;
      try {
        await artifactsOperator.hide(this.token, item.id, nextHidden);
        if (this.showHidden) {
          // Keep the item in place so the user can toggle it again.
          item.hidden = nextHidden;
        } else {
          this.items = this.items.filter((i) => i.id !== item.id);
          this.count = Math.max(0, this.count - 1);
          this.offset = Math.max(0, this.offset - 1);
        }
        this.loadSummary();
      } catch (e) {
        console.error('toggle hide artifact failed', e);
        ElMessage.error(this.$t('chat.artifacts.actionError'));
      }
    },
    async onDelete(item: IArtifact) {
      if (!this.token) return;
      try {
        await ElMessageBox.confirm(this.$t('chat.artifacts.deleteConfirm'), '', {
          type: 'warning'
        });
      } catch {
        return; // user cancelled
      }
      try {
        await artifactsOperator.remove(this.token, item.id);
        this.items = this.items.filter((i) => i.id !== item.id);
        this.count = Math.max(0, this.count - 1);
        this.offset = Math.max(0, this.offset - 1);
        this.loadSummary();
      } catch (e) {
        console.error('delete artifact failed', e);
        ElMessage.error(this.$t('chat.artifacts.actionError'));
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.artifacts {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page) !important;
}

.inner {
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.show-hidden {
  flex-shrink: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  padding: 4px 12px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color));
  border-radius: var(--el-border-radius-round);
  background: var(--app-bg-surface, var(--el-bg-color-overlay));
  color: var(--el-text-color-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition:
    color 0.16s,
    border-color 0.16s,
    background-color 0.16s;
}

.filter-chip:hover:not(.active) {
  border-color: var(--el-color-primary);
  background: rgba(var(--app-brand-rgb), 0.06);
  color: var(--el-color-primary);
}

.filter-chip:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.filter-chip.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #ffffff;
}

.filter-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: var(--el-border-radius-round);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.filter-chip.active .filter-count {
  background: rgba(0, 0, 0, 0.2);
  color: #ffffff;
}

.loading-block {
  padding: 12px 4px;
}

.empty {
  padding: 60px 0;
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.artifact-card {
  overflow: hidden;
  border: none;
  border-radius: 16px;
  background: var(--app-bg-surface, var(--el-bg-color-overlay));

  :deep(.el-card__body) {
    padding: 16px 18px;
  }
}

.artifact-body {
  display: flex;
  gap: 14px;
}

.thumb {
  width: 96px;
  height: 96px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--app-border-subtle, var(--el-border-color-lighter));
  border-radius: 10px;
  background: var(--el-fill-color-light);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumb:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.artifact-main {
  flex: 1;
  min-width: 0;
}

.artifact-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 5px;
}

.channel {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.time {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.artifact-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.artifact-summary {
  margin-top: 3px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.artifact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.artifact-actions .el-button + .el-button {
  margin-left: 0;
}

.icon {
  margin-right: 4px;
}

.load-more {
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 767px) {
  .inner {
    padding: 20px 12px 40px;
  }

  .header {
    margin-bottom: 16px;
  }

  .filters {
    flex-wrap: nowrap;
    margin-right: -12px;
    padding-right: 12px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filters::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    flex-shrink: 0;
  }

  .artifact-card {
    :deep(.el-card__body) {
      padding: 14px;
    }
  }

  .artifact-body {
    gap: 12px;
  }

  .thumb {
    width: 80px;
    height: 80px;
  }

  .time {
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 479px) {
  .title {
    font-size: 19px;
  }

  .thumb {
    width: 72px;
    height: 72px;
  }

  .artifact-summary {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
}
</style>
