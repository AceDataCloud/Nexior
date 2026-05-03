<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row class="header" justify="space-between" align="middle">
        <el-col :md="16" :xs="24">
          <h2 class="title">{{ $t('subsite.title.index') }}</h2>
          <p class="tip">{{ $t('subsite.message.indexTip') }}</p>
        </el-col>
        <el-col :md="8" :xs="24" class="header-actions">
          <el-button type="primary" round :icon="Plus" :disabled="!canCreate" @click="onOpenCreate">
            {{ $t('subsite.button.create') }}
          </el-button>
        </el-col>
      </el-row>

      <el-card v-loading="loading" shadow="hover" class="list-card">
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
          <el-table-column :label="$t('subsite.field.createdAt')" prop="created_at" width="180">
            <template #default="{ row }">
              <span>{{ formatDate(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('subsite.field.actions')" width="260" fixed="right">
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
    </el-col>

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
          <span class="tip">{{ $t('subsite.message.slugTip') }}</span>
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
  </el-row>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import {
  ElRow,
  ElCol,
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
  ElMessageBox
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { siteOperator } from '@/operators';
import type { ISite } from '@/models';
import DomainsDialog from './DomainsDialog.vue';

const SLUG_RE = /^(?!.*--)[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export default defineComponent({
  name: 'SubsiteIndex',
  components: {
    ElRow,
    ElCol,
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
      return zone || this.parentSite?.origin || '';
    },
    maxSubsitesPerUser(): number {
      const max = this.parentSite?.features?.subsite?.max_subsites_per_user;
      return typeof max === 'number' && max > 0 ? max : 5;
    },
    canCreate(): boolean {
      return (
        Boolean(this.parentSite?.features?.subsite?.enabled) &&
        Boolean(this.subdomainZone) &&
        Boolean(this.user?.id) &&
        this.items.length < this.maxSubsitesPerUser
      );
    }
  },
  mounted() {
    if (!this.parentSite?.features?.subsite?.enabled) {
      // Server-side check is the source of truth, but bail out here to avoid
      // a 403 storm on origins that haven't opted in.
      this.$router.replace('/');
      return;
    }
    this.fetchSubsites();
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
        // Backend filters by user_id; we further restrict to children of the
        // current parent so a single user creating subsites under multiple
        // parent sites still sees the right subset on each.
        this.items = all.filter((s) => {
          if (s.id === parentId) return false;
          const meta = (s.metadata || {}) as Record<string, unknown>;
          if (parentId && meta.parent_site_id) return meta.parent_site_id === parentId;
          // Fallback for older subsites without parent_site_id metadata: match
          // by suffix under the configured subdomain zone.
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
        // Offer to jump straight to the new subsite so the user can finish
        // branding and feature toggles there.
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
      // Each subsite is the source of truth for its own settings; deep-link to
      // /site on the subsite itself instead of trying to manage cross-origin.
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
.panel {
  padding: 30px;
  background-color: var(--el-bg-color-page);
  overflow-y: auto;

  h2.title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 6px;
    color: var(--el-text-color-primary);
  }

  .tip {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin: 0 0 16px 0;
  }

  .header-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 16px;
  }

  .list-card {
    margin-top: 12px;
  }

  .origin-link {
    color: var(--el-color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  .form {
    .tip {
      display: block;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      margin-top: 4px;
    }
  }
}
</style>
