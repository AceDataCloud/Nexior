<template>
  <div class="subsite-settings">
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
      <el-table v-else :data="items" stripe>
        <el-table-column :label="$t('subsite.field.origin')" prop="origin">
          <template #default="{ row }">
            <a :href="rowUrl(row)" target="_blank" rel="noopener" class="origin-link">
              {{ row.origin }}
            </a>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subsite.field.title')" prop="title">
          <template #default="{ row }">
            <span>{{ row.title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subsite.field.createdAt')" prop="created_at" width="170">
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('subsite.field.actions')" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="onOpenSite(row)">
              {{ $t('subsite.button.open') }}
            </el-button>
            <el-button size="small" link type="primary" @click="onManageSite(row)">
              {{ $t('subsite.button.manage') }}
            </el-button>
            <el-button size="small" link type="primary" @click="onOpenDomains(row)">
              {{ $t('subsite.button.domains') }}
            </el-button>
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

    <domains-dialog v-model="domainsDialog.visible" :site="domainsDialog.site" />
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
import type { ISite } from '@/models';
import DomainsDialog from '@/components/setting/SubsiteDomainsDialog.vue';

const SLUG_RE = /^(?!.*--)[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

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
    DomainsDialog
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
      },
      domainsDialog: {
        visible: false,
        site: null as ISite | null
      }
    };
  },
  computed: {
    parentSite(): ISite | undefined {
      return this.$store.state.site;
    },
    user() {
      return this.$store.getters.user;
    },
    subdomainZone(): string {
      const zone = this.parentSite?.features?.subsite?.subdomain_zone;
      if (zone) return zone;
      // Fall back to the bare current host so the create dialog can render
      // even if `state.site` hasn't been hydrated with the subsite block yet.
      if (typeof window !== 'undefined' && window.location?.host) {
        return window.location.host.split(':')[0];
      }
      return this.parentSite?.origin || '';
    },
    maxSubsitesPerUser(): number {
      const max = this.parentSite?.features?.subsite?.max_subsites_per_user;
      return typeof max === 'number' && max > 0 ? max : 5;
    },
    canCreate(): boolean {
      return Boolean(this.subdomainZone) && Boolean(this.user?.id) && this.items.length < this.maxSubsitesPerUser;
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
      this.loading = true;
      try {
        const { data } = await siteOperator.getAll({ user_id: userId });
        const all = (data?.items || []) as ISite[];
        const parentId = this.parentSite?.id;
        this.items = all.filter((s) => {
          if (s.id === parentId) return false;
          const meta = (s.metadata || {}) as Record<string, unknown>;
          if (parentId && meta.parent_site_id) return meta.parent_site_id === parentId;
          return Boolean(s.origin && this.subdomainZone && s.origin.endsWith(`.${this.subdomainZone}`));
        });
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
        const detail = e?.response?.data?.origin || e?.response?.data?.detail || e?.message;
        ElMessage.error(typeof detail === 'string' ? detail : this.$t('subsite.message.createFailed'));
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
      window.open(`https://${row.origin}/site`, '_blank', 'noopener');
    },
    onOpenDomains(row: ISite) {
      this.domainsDialog.site = row;
      this.domainsDialog.visible = true;
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
    &:hover {
      text-decoration: underline;
    }
  }

  .form .hint {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>
