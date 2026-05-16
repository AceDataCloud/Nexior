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
        <el-table-column :label="$t('subsite.field.origin')" prop="origin" min-width="240">
          <template #default="{ row }">
            <div class="domain-list">
              <a :href="rowUrl(row)" target="_blank" rel="noopener" class="origin-link primary">
                {{ row.origin }}
              </a>
              <template v-for="dom in customDomainsFor(row)" :key="dom.id">
                <a
                  v-if="dom.status === SiteDomainStatus.Active"
                  :href="`https://${dom.hostname}/`"
                  target="_blank"
                  rel="noopener"
                  class="custom-domain origin-link"
                >
                  {{ dom.hostname }}
                  <el-tag size="small" type="success" effect="plain" round>
                    {{ $t('subsite.status.active') }}
                  </el-tag>
                </a>
                <div v-else-if="dom.status === SiteDomainStatus.Pending" class="custom-domain muted">
                  <span class="hostname">{{ dom.hostname }}</span>
                  <el-tag size="small" type="warning" effect="plain" round>
                    {{ $t('subsite.status.pending') }}
                  </el-tag>
                </div>
                <div v-else-if="dom.status === SiteDomainStatus.Failed" class="custom-domain muted">
                  <span class="hostname">{{ dom.hostname }}</span>
                  <el-tag size="small" type="danger" effect="plain" round>
                    {{ $t('subsite.status.failed') }}
                  </el-tag>
                </div>
              </template>
            </div>
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

    <el-dialog
      v-model="opening.visible"
      :title="$t('subsite.title.openSite')"
      width="460px"
      class="open-dialog"
      append-to-body
    >
      <p class="open-hint">{{ $t('subsite.message.openSiteHint') }}</p>
      <div class="open-urls">
        <button
          v-for="url in opening.urls"
          :key="url.href"
          type="button"
          class="open-url"
          @click="onConfirmOpen(url.href)"
        >
          <span class="open-url-host">{{ url.hostname }}</span>
          <el-tag v-if="!url.isCustom" size="small" type="info" effect="plain" round>
            {{ $t('subsite.field.defaultLabel') }}
          </el-tag>
          <el-tag v-else size="small" type="success" effect="plain" round>
            {{ $t('subsite.field.customLabel') }}
          </el-tag>
        </button>
      </div>
      <template #footer>
        <el-button round @click="opening.visible = false">{{ $t('common.button.cancel') }}</el-button>
      </template>
    </el-dialog>

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
  ElTag,
  vLoading
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { siteOperator, siteDomainOperator } from '@/operators';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import { SiteDomainStatus, type ISite, type ISiteDomain } from '@/models';

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
    ElTag,
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
      // Re-export the enum for the template (string-comparable in v-if).
      SiteDomainStatus,
      loading: false,
      items: [] as ISite[],
      // Custom (BYO) domains grouped by their parent subsite id. Fetched
      // alongside `items` so the column can render every bound hostname,
      // and so the open-confirmation dialog can offer Active customs as
      // pickable URLs.
      domainsBySite: {} as Record<string, ISiteDomain[]>,
      // Drives the unified "Open subsite" confirmation dialog. Built on
      // demand from `customDomainsFor(row)` so the URL list is always
      // fresh w.r.t. the latest domain statuses.
      opening: {
        visible: false,
        urls: [] as { href: string; hostname: string; isCustom: boolean }[]
      },
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
      const zone = this.subdomainZone;
      if (!zone) {
        // Parent site hasn't been seeded with a subdomain zone yet —
        // surface the empty state rather than dumping every site the
        // user happens to own elsewhere.
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
        await this.fetchDomains();
      } catch (e) {
        console.error('failed to load subsites', e);
        ElMessage.error(this.$t('subsite.message.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    async fetchDomains() {
      // Fan-out one GET per subsite (typical max is 5). We deliberately
      // filter by site id rather than user_id because that's the only
      // filter known to be wired up server-side (mirrors CustomDomain.vue),
      // and the per-row swarm is bounded by `maxSubsitesPerUser`.
      // Failures are swallowed per-row so one site's RBAC hiccup doesn't
      // hide every other site's domains.
      const sites = this.items.filter((s) => s.id);
      if (sites.length === 0) {
        this.domainsBySite = {};
        return;
      }
      const pairs = await Promise.all(
        sites.map(async (s) => {
          try {
            const { data } = await siteDomainOperator.getAll({ site: s.id, limit: 50 });
            return [s.id as string, (data?.items || []) as ISiteDomain[]] as const;
          } catch (err) {
            console.warn(`failed to load domains for site ${s.id}`, err);
            return [s.id as string, [] as ISiteDomain[]] as const;
          }
        })
      );
      this.domainsBySite = Object.fromEntries(pairs);
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
      // Build the URL picker once, on demand. We always include the
      // default subdomain. Active custom domains are listed beneath so
      // a tenant who's bound their own brand URL can land there
      // directly without re-typing the hostname. Pending / Failed
      // customs are intentionally excluded — they wouldn't actually
      // load until DNS + TLS are green.
      const urls: { href: string; hostname: string; isCustom: boolean }[] = [
        { href: `https://${row.origin}/`, hostname: row.origin, isCustom: false }
      ];
      const customs = this.customDomainsFor(row);
      for (const d of customs) {
        if (d.status === SiteDomainStatus.Active && d.hostname) {
          urls.push({ href: `https://${d.hostname}/`, hostname: d.hostname, isCustom: true });
        }
      }
      this.opening.urls = urls;
      this.opening.visible = true;
    },
    onConfirmOpen(href: string) {
      this.opening.visible = false;
      window.open(href, '_blank', 'noopener');
    },
    customDomainsFor(row: ISite): ISiteDomain[] {
      if (!row.id) return [];
      const list = this.domainsBySite[row.id] || [];
      // Keep a stable order: Active first (clickable), then Pending,
      // then Failed — and alphabetize within each bucket so reloads
      // don't shuffle the column.
      const rank = (s?: SiteDomainStatus) =>
        s === SiteDomainStatus.Active ? 0 : s === SiteDomainStatus.Pending ? 1 : 2;
      return [...list].sort((a, b) => {
        const r = rank(a.status) - rank(b.status);
        if (r !== 0) return r;
        return (a.hostname || '').localeCompare(b.hostname || '');
      });
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
  .domain-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    .origin-link.primary {
      font-weight: 500;
    }
    .custom-domain {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      line-height: 1.4;

      .hostname {
        word-break: break-all;
      }
      &.muted {
        color: var(--el-text-color-secondary);
      }
      &.origin-link {
        font-weight: 400;
      }
    }
  }
  .row-title {
    margin-top: 4px;
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

// Scoped styles on the open-dialog rely on `:deep` because el-dialog
// portals its body outside `.subsite-settings`. Keeping them in the
// same <style scoped> block avoids leaking selectors globally while
// still reaching the teleported nodes.
.open-dialog {
  :deep(.open-hint) {
    margin: 0 0 12px 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
  :deep(.open-urls) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  :deep(.open-url) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--el-border-color);
    border-radius: 999px;
    background: var(--el-fill-color-blank);
    color: var(--el-color-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background-color 0.15s,
      box-shadow 0.15s;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
    }
    .open-url-host {
      word-break: break-all;
      text-align: left;
    }
  }
}
</style>
