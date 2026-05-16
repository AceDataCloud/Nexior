<template>
  <div class="subsite-settings">
    <section-notice tone="official" :text="$t('common.settings.officialOnlyHint')" />
    <div class="header">
      <div>
        <p class="settings-title">{{ $t('subsite.title.index') }}</p>
        <p class="settings-tip">{{ $t('subsite.message.indexTip') }}</p>
      </div>
      <el-button type="primary" round :icon="Plus" :disabled="!canCreate" @click="onOpenCreate">
        {{ $t('subsite.button.create') }}
      </el-button>
    </div>

    <el-card v-loading="loading" shadow="never" class="list-card">
      <el-empty v-if="!loading && items.length === 0" :description="$t('subsite.message.empty')" />
      <el-table v-else :data="items" stripe class="subsite-table">
        <el-table-column :label="$t('subsite.field.origin')" prop="origin" min-width="220">
          <template #default="{ row }">
            <a :href="rowUrl(row)" target="_blank" rel="noopener" class="origin-link">
              {{ row.origin }}
            </a>
            <div v-if="row.title" class="row-title">{{ row.title }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subsite.field.createdAt')" prop="created_at" width="170">
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subsite.field.actions')" width="200" fixed="right" align="right">
          <template #default="{ row }">
            <span class="row-actions">
              <el-button size="small" round @click="onOpenSite(row)">
                {{ $t('subsite.button.open') }}
              </el-button>
              <el-button size="small" round @click="onManageSite(row)">
                {{ $t('subsite.button.manage') }}
              </el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="creating.visible" :title="$t('subsite.title.create')" width="480px" class="create-dialog">
      <el-form :model="creating.form" label-width="auto" class="form" @submit.prevent>
        <el-form-item :label="$t('subsite.field.slug')" required>
          <el-input
            v-model="creating.form.slug"
            :placeholder="$t('subsite.placeholder.slug')"
            maxlength="32"
            show-word-limit
            autofocus
          >
            <template #append>.{{ subdomainZone }}</template>
          </el-input>
          <span class="hint">{{ $t('subsite.message.slugTip') }}</span>
        </el-form-item>
        <el-form-item :label="$t('subsite.field.title')">
          <el-input v-model="creating.form.title" :placeholder="$t('subsite.placeholder.title')" maxlength="80" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button round @click="onCancelCreate">{{ $t('common.button.cancel') }}</el-button>
          <el-button
            round
            type="primary"
            :loading="creating.submitting"
            :disabled="!creating.form.slug.trim()"
            @click="onSubmitCreate"
          >
            {{ $t('common.button.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  vLoading
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { siteOperator } from '@/operators';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import type { ISite } from '@/models';
import { isOfficial, isSubOfficial } from '@/utils/is';
import { BASE_HOST_HUB } from '@/constants';

const SLUG_RE = /^(?!.*--)[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

/** Maximum number of subsites a single user can spin up.  Mirrors the
 *  default the backend's subsite-create path enforces when the parent
 *  Site row hasn't been seeded with an explicit per-user quota. */
const MAX_SUBSITES_PER_USER = 5;

/**
 * Settings tab — manage white-label subsites for the parent (official)
 * Site row. Logic mirrors what used to live at the standalone
 * `/subsite` page, but reframed to fit inside the user-settings dialog
 * so subsite management is just another setting (alongside General /
 * BYOK / Distribution / etc.) instead of an out-of-band route.
 *
 * Visibility is gated upstream by `Setting.vue` to the official main
 * host only; subsites themselves never see this tab.
 */
export default defineComponent({
  name: 'SubsiteSetting',
  components: {
    ElCard,
    ElButton,
    ElTable,
    ElTableColumn,
    ElEmpty,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    SectionNotice
  },
  directives: {
    loading: vLoading
  },
  props: {
    /** When true on mount, automatically open the create dialog so the
     *  one-click "Build same" entry on the About tab can drop the user
     *  straight into create flow. */
    autoOpenCreate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      Plus: markRaw(Plus),
      loading: false,
      items: [] as ISite[],
      creating: {
        visible: false,
        submitting: false,
        form: {
          slug: '',
          title: ''
        }
      }
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    /**
     * DNS suffix new subsites are spawned under — always the canonical
     * Hub host (`BASE_HOST_HUB`, e.g. `studio.acedata.cloud`). The backend's
     * subsite-create path pins ``origin = f"{slug}.{parent.origin}"`` against
     * this same value, so we don't need to fetch the parent Site row just to
     * read it back from ``parent.features.subsite.subdomain_zone``.
     */
    subdomainZone(): string {
      return BASE_HOST_HUB;
    },
    /**
     * Whether the current user can spin up another subsite right now.
     *
     *   * Must be on the canonical Hub host (`isOfficial()`),
     *   * NOT on a subsite under it (`!isSubOfficial()`) — subsites can't
     *     themselves spawn further subsites,
     *   * Must be signed in (`user.id`),
     *   * Must be under the per-user quota.
     *
     * Mirrors PlatformFrontend's Sites console gate; replaces the previous
     * `parent.features.subsite.{enabled,subdomain_zone}` lookup which required
     * fetching the parent Site row just to gate one button + read back a
     * value (`BASE_HOST_HUB`) that's already a build-time constant on this
     * side of the wire.
     */
    canCreate(): boolean {
      return (
        isOfficial() &&
        !isSubOfficial() &&
        Boolean(this.user?.id) &&
        this.items.length < MAX_SUBSITES_PER_USER
      );
    }
  },
  watch: {
    // Auto-open the create dialog when the prop flips on (used by the
    // "Build same site" one-click flow on About.vue).
    autoOpenCreate: {
      immediate: false,
      handler(open: boolean) {
        if (open) this.onOpenCreate();
      }
    }
  },
  mounted() {
    this.fetchSubsites();
    if (this.autoOpenCreate) this.onOpenCreate();
  },
  methods: {
    async fetchSubsites() {
      const userId = this.user?.id;
      if (!userId) {
        this.items = [];
        return;
      }
      const zone = this.subdomainZone;
      if (!zone) {
        // SSR / pre-mount path — BASE_HOST_HUB is a constant so this branch
        // is effectively dead, but keep the guard cheap so we never POST
        // a query with a blank suffix filter and end up listing every site
        // the user owns under any host.
        this.items = [];
        return;
      }
      this.loading = true;
      try {
        // Listing is fully scoped by (user_id, origin__endswith=.{zone}).
        // The leading dot excludes the parent (`studio.acedata.cloud`) by
        // DNS-hierarchy semantics and matches every subsite
        // (`<slug>.studio.acedata.cloud`). No `parent_site_id` needed —
        // the superuser fast path doesn't stamp `metadata.parent_site_id`
        // anyway, which is why the previous metadata filter hid rows.
        const { data } = await siteOperator.getAll({
          user_id: userId,
          origin__endswith: `.${zone}`,
          ordering: '-created_at'
        });
        this.items = (data?.items || []) as ISite[];
      } catch (e) {
        console.error('failed to load subsites', e);
        ElMessage.error(this.$t('subsite.message.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    onOpenCreate() {
      this.creating.form.slug = '';
      this.creating.form.title = '';
      this.creating.visible = true;
    },
    onCancelCreate() {
      this.creating.visible = false;
    },
    async onSubmitCreate() {
      const slug = this.creating.form.slug.trim().toLowerCase();
      if (!SLUG_RE.test(slug)) {
        ElMessage.warning(this.$t('subsite.message.slugInvalid'));
        return;
      }
      if (!this.subdomainZone) {
        ElMessage.error(this.$t('subsite.message.zoneMissing'));
        return;
      }
      const origin = `${slug}.${this.subdomainZone}`;
      this.creating.submitting = true;
      try {
        const { data } = await siteOperator.create({
          origin,
          title: this.creating.form.title.trim() || undefined
        });
        ElMessage.success(this.$t('subsite.message.created'));
        this.creating.visible = false;
        this.items = [data, ...this.items];
        ElMessageBox.confirm(
          this.$t('subsite.message.openNowConfirm', { origin }) as string,
          this.$t('subsite.title.openNow') as string,
          {
            confirmButtonText: this.$t('subsite.button.open') as string,
            cancelButtonText: this.$t('common.button.cancel') as string,
            type: 'success'
          }
        )
          .then(() => window.open(`https://${origin}/`, '_blank', 'noopener'))
          .catch(() => {
            /* user dismissed */
          });
      } catch (e: any) {
        const resp = e?.response?.data;
        // Backend returns `{ detail: { origin: '...' }, code: 'duplication' }`
        // for slug collisions — show a localized "already taken" message
        // and keep the dialog open so the user can edit the slug instead
        // of dumping raw JSON via ElMessage.
        if (resp?.code === 'duplication') {
          ElMessage.error(this.$t('subsite.message.slugTaken', { origin }));
          return;
        }
        // Pull whatever readable string the server gave us (legacy paths
        // may still respond with a top-level `origin` array, or a string
        // `detail`). Anything non-string falls back to the generic copy.
        const raw = resp?.detail?.origin ?? resp?.origin ?? resp?.detail ?? e?.message;
        const message = Array.isArray(raw) ? raw[0] : raw;
        ElMessage.error(typeof message === 'string' && message ? message : this.$t('subsite.message.createFailed'));
      } finally {
        this.creating.submitting = false;
      }
    },
    onOpenSite(row: ISite) {
      if (!row.origin) return;
      window.open(`https://${row.origin}/`, '_blank', 'noopener');
    },
    onManageSite(row: ISite) {
      if (!row.origin) return;
      // Open the subsite at its root and signal the user-settings dialog
      // to auto-open via the `?dialog=settings` query flag. The root
      // route still redirects to whatever the subsite's default landing
      // page is (e.g. /chatgpt/conversations) — the query is preserved
      // through the redirect, and `UserCenter` picks it up on mount and
      // pops the settings dialog. This avoids the blank `/settings`
      // page race where SettingsIndex dispatches `open-user-settings`
      // before UserCenter's listener is registered.
      window.open(`https://${row.origin}/?dialog=settings`, '_blank', 'noopener');
    },
    rowUrl(row: ISite) {
      return row.origin ? `https://${row.origin}/` : '#';
    },
    formatDate(value?: string) {
      if (!value) return '-';
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.subsite-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    .settings-title {
      font-weight: 600;
      font-size: 14px;
      margin: 0 0 4px 0;
    }
    .settings-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .list-card {
    border: 1px solid var(--el-border-color-lighter);
  }

  .origin-link {
    color: var(--el-color-primary);
    text-decoration: none;
    word-break: break-all;
    &:hover {
      text-decoration: underline;
    }
  }
  .row-title {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
  .row-actions {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .subsite-table :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  .form .hint {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>
