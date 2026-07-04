<template>
  <div class="artifacts">
    <div class="inner">
      <div class="header">
        <h2 class="title">{{ $t('chat.artifacts.title') }}</h2>
        <el-switch
          v-model="showHidden"
          class="show-hidden"
          :active-text="$t('chat.artifacts.showHidden')"
          @change="reload"
        />
      </div>

      <!-- Summary card -->
      <el-card v-if="summary && summary.total > 0" class="summary-card" shadow="never">
        <div class="summary-total">{{ $t('chat.artifacts.summaryTotal', { count: summary.total }) }}</div>
        <div class="summary-kinds">
          <el-tag v-for="(count, kind) in summary.by_kind" :key="kind" round class="summary-tag">
            {{ $t('chat.artifacts.kind.' + kind) }} · {{ count }}
          </el-tag>
        </div>
      </el-card>

      <!-- Kind filter tabs -->
      <div class="filters">
        <el-tag
          v-for="opt in kindFilters"
          :key="opt"
          :effect="activeKind === opt ? 'dark' : 'plain'"
          round
          class="filter-tag"
          @click="onFilter(opt)"
        >
          {{ opt === 'all' ? $t('chat.artifacts.filterAll') : $t('chat.artifacts.kind.' + opt) }}
        </el-tag>
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
                    <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="icon" />
                    {{ $t('chat.artifacts.open') }}
                  </el-button>
                  <el-button size="small" text @click="onToggleHide(item)">
                    <font-awesome-icon :icon="item.hidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" class="icon" />
                    {{ item.hidden ? $t('chat.artifacts.unhide') : $t('chat.artifacts.hide') }}
                  </el-button>
                  <el-button size="small" text type="danger" @click="onDelete(item)">
                    <font-awesome-icon icon="fa-solid fa-trash" class="icon" />
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
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElButton, ElCard, ElSkeleton, ElEmpty, ElTag, ElSwitch, ElMessage, ElMessageBox } from 'element-plus';
import { artifactsOperator, IArtifact, IArtifactKind } from '@/operators/artifacts';

const PAGE_SIZE = 30;
const KIND_FILTERS: (IArtifactKind | 'all')[] = ['all', 'article', 'image', 'video', 'audio', 'email', 'document'];

export default defineComponent({
  name: 'Artifacts',
  components: { FontAwesomeIcon, ElButton, ElCard, ElSkeleton, ElEmpty, ElTag, ElSwitch },
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
      reloadToken: 0
    };
  },
  computed: {
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    },
    hasMore(): boolean {
      return this.items.length < this.count;
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
      try {
        this.summary = await artifactsOperator.summary(this.token);
      } catch (e) {
        console.error('load artifact summary failed', e);
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
  .inner {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 16px 64px;
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      .title {
        margin: 0;
        font-size: 20px;
      }
    }
    .summary-card {
      margin-bottom: 16px;
      .summary-total {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .summary-kinds {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
      .filter-tag {
        cursor: pointer;
      }
    }
    .artifact-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .artifact-card {
      .artifact-body {
        display: flex;
        gap: 12px;
        .thumb {
          flex-shrink: 0;
          width: 96px;
          height: 96px;
          border-radius: 8px;
          overflow: hidden;
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
        .artifact-main {
          flex: 1;
          min-width: 0;
          .artifact-top {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 4px;
            .channel {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
            .time {
              font-size: 12px;
              color: var(--el-text-color-placeholder);
              margin-left: auto;
            }
          }
          .artifact-title {
            font-weight: 600;
            word-break: break-word;
          }
          .artifact-summary {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin-top: 2px;
            word-break: break-word;
          }
          .artifact-actions {
            margin-top: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            .icon {
              margin-right: 4px;
            }
          }
        }
      }
    }
    .load-more {
      text-align: center;
      margin-top: 16px;
    }
  }
}
</style>
