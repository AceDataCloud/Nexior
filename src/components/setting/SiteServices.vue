<template>
  <div class="site-services-settings">
    <section-notice tone="admin" :text="$t('common.settings.adminOnlyHint')" />
    <section class="default-price-section">
      <div>
        <p class="settings-title">{{ $t('site.field.markupRatio') }}</p>
        <p class="settings-tip">{{ $t('site.message.markupRatioTip') }}</p>
      </div>
      <div class="markup-row">
        <el-input-number
          :model-value="siteMarkupDraftPercent"
          :min="0"
          :max="MARKUP_RATIO_MAX * 100"
          :step="1"
          :precision="2"
          :controls-position="'right'"
          :disabled="siteMarkupSaving"
          class="markup-input"
          @change="onSaveSiteMarkup"
        />
        <span class="markup-percent">%</span>
      </div>
    </section>

    <div class="header">
      <div>
        <p class="settings-title">{{ $t('site.services.title') }}</p>
        <p class="settings-tip">{{ $t('site.services.tip') }}</p>
      </div>
      <el-button type="primary" round :icon="Plus" :disabled="!site?.id" @click="onOpenCreate">
        {{ $t('site.services.addButton') }}
      </el-button>
    </div>

    <el-card v-loading="loading" shadow="never" class="list-card">
      <el-empty v-if="!loading && rows.length === 0" :description="$t('site.services.empty')" :image-size="80" />
      <el-table v-else :data="rows" stripe class="overrides-table">
        <el-table-column :label="$t('site.services.field.service')" min-width="200">
          <template #default="{ row }">
            <div class="service-cell">
              <img v-if="catalogIcon(row.service)" :src="catalogIcon(row.service)" class="service-favicon" alt="" />
              <div class="service-cell-text">
                <strong>{{ catalogTitle(row.service) }}</strong>
                <div v-if="catalogAlias(row.service)" class="muted">{{ catalogAlias(row.service) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('site.services.field.visible')" width="96" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === false ? 'info' : 'success'" size="small" round effect="plain">
              {{ row.visible === false ? $t('site.services.status.hidden') : $t('site.services.status.visible') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('site.services.field.customMarkupRatio')" width="150" align="right">
          <template #default="{ row }">
            <span v-if="row.markup_ratio === null || row.markup_ratio === undefined" class="muted">{{
              $t('site.services.status.inherit')
            }}</span>
            <span v-else>{{ formatMarkup(row.markup_ratio) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('site.services.field.displayTitle')" min-width="140">
          <template #default="{ row }">
            <span v-if="!row.display_title" class="muted">—</span>
            <span v-else>{{ row.display_title }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('site.services.field.sortOrder')" width="88" align="right">
          <template #default="{ row }">{{ row.sort_order ?? 0 }}</template>
        </el-table-column>
        <el-table-column :label="$t('site.services.field.action')" width="150" align="right" fixed="right">
          <template #default="{ row }">
            <el-button size="small" round @click="onOpenEdit(row)">{{ $t('common.button.edit') }}</el-button>
            <el-button size="small" round type="danger" plain :loading="deletingId === row.id" @click="onDelete(row)">
              {{ $t('common.button.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- create / edit share one dialog: `editingRow` null = create -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRow ? $t('site.services.dialog.edit') : $t('site.services.dialog.create')"
      :width="mobile ? '94vw' : '520px'"
      class="site-service-override-dialog"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="form" label-position="top" class="service-override-form" @submit.prevent>
        <el-form-item :label="$t('site.services.field.service')" required>
          <el-input v-if="editingRow" :model-value="catalogTitle(editingRow.service)" readonly />
          <el-select
            v-else
            v-model="form.service"
            filterable
            :loading="catalogLoading"
            popper-class="service-catalog-select-popper"
            class="w-full"
          >
            <el-option
              v-for="svc in catalogOptions"
              :key="svc.id"
              :label="optionLabel(svc)"
              :value="svc.id"
              :disabled="isAlreadyOverridden(svc.id)"
            >
              <span class="service-option">
                <img v-if="svc.icon_url" :src="svc.icon_url" class="option-favicon" alt="" />
                <span class="option-title">{{ svc.title || svc.id }}</span>
                <span v-if="svc.alias" class="option-alias">{{ svc.alias }}</span>
                <el-tag v-if="isAlreadyOverridden(svc.id)" size="small" type="info" round>
                  {{ $t('site.services.message.alreadyOverridden') }}
                </el-tag>
              </span>
            </el-option>
          </el-select>
          <div class="field-desc">{{ $t('site.services.placeholder.service') }}</div>
        </el-form-item>

        <el-form-item :label="$t('site.services.field.visible')">
          <el-switch v-model="form.visible" />
          <div class="field-desc">{{ $t('site.services.tip.visible') }}</div>
        </el-form-item>

        <el-form-item :label="$t('site.services.field.customMarkupRatio')">
          <div class="markup-row">
            <el-input-number
              v-model="markupPercent"
              :min="0"
              :max="markupPercentMax"
              :step="1"
              :precision="2"
              :controls-position="'right'"
              :placeholder="$t('site.services.placeholder.markup')"
              class="markup-input"
            />
            <span class="markup-percent">%</span>
          </div>
          <div class="field-desc">{{ $t('site.services.tip.markup') }}</div>
        </el-form-item>

        <el-form-item :label="$t('site.services.field.displayTitle')">
          <el-input v-model="form.displayTitle" maxlength="120" show-word-limit clearable>
            <template #suffix>
              <auto-translate-toggle
                model="site_service_override"
                field="display_title"
                :object-id="editingRow?.id"
                :enabled="form.autoTranslatedFields.includes('display_title')"
                :current-value="form.displayTitle"
                @enabled-success="onDisplayTitleEnabled"
                @disabled-success="onDisplayTitleDisabled"
              />
            </template>
          </el-input>
          <div class="field-desc">{{ $t('site.services.placeholder.displayTitle') }}</div>
        </el-form-item>

        <el-form-item :label="$t('site.services.field.displaySummary')">
          <el-input v-model="form.displaySummary" type="textarea" :rows="3" clearable />
          <div class="field-desc">{{ $t('site.services.placeholder.displaySummary') }}</div>
          <!-- textarea has no #suffix slot; render the toggle inline beneath -->
          <div class="auto-translate-inline">
            <auto-translate-toggle
              model="site_service_override"
              field="display_summary"
              :object-id="editingRow?.id"
              :enabled="form.autoTranslatedFields.includes('display_summary')"
              :current-value="form.displaySummary"
              @enabled-success="onDisplaySummaryEnabled"
              @disabled-success="onDisplaySummaryDisabled"
            />
            <span class="field-tip">
              {{
                editingRow
                  ? form.autoTranslatedFields.includes('display_summary')
                    ? $t('site.autoTranslate.tooltipOn')
                    : $t('site.autoTranslate.tooltipOff')
                  : $t('site.autoTranslate.tooltipDisabledNotSaved')
              }}
            </span>
          </div>
        </el-form-item>

        <el-form-item :label="$t('site.services.field.sortOrder')">
          <el-input-number
            v-model="form.sortOrder"
            :min="-1000"
            :max="1000"
            :step="1"
            :precision="0"
            :controls-position="'right'"
          />
          <div class="field-desc">{{ $t('site.services.tip.sortOrder') }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button
          type="primary"
          round
          :loading="submitting"
          :disabled="!editingRow && !form.service"
          @click="onSubmit"
        >
          {{ editingRow ? $t('common.button.update') : $t('common.button.create') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import {
  ElButton,
  ElCard,
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElSwitch,
  ElTag,
  ElMessage,
  ElMessageBox,
  vLoading
} from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { serviceOperator, siteOperator, siteServiceOverrideOperator } from '@/operators';
import type { IService, ISite, ISiteServiceOverride } from '@/models';
import SectionNotice from '@/components/setting/SectionNotice.vue';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import { getSiteMarkupRatio, MARKUP_RATIO_MAX } from '@/utils';

// Pre-fetch the whole catalog once so each override row can show the
// service title/alias without an N+1 per-row GET. If a tenant ever
// exceeds this many services the picker should switch to remote search.
const CATALOG_PAGE_LIMIT = 1000;
interface IForm {
  service: string;
  visible: boolean;
  markupRatio: number | undefined;
  displayTitle: string;
  displaySummary: string;
  sortOrder: number;
  // Server-derived: names of fields currently stored as ``$t(...)`` refs
  // (auto-translated to 17 locales) rather than literal text.
  autoTranslatedFields: string[];
}

function emptyForm(): IForm {
  return {
    service: '',
    visible: true,
    markupRatio: undefined,
    displayTitle: '',
    displaySummary: '',
    sortOrder: 0,
    autoTranslatedFields: []
  };
}

/**
 * Settings tab — per-service overrides for the current Site: hide a
 * service, rename its homepage card, write a custom summary, reorder,
 * or charge a per-service markup on top of (overriding) the site-wide
 * default. Mirrors the developer-portal Services tab but scoped to the
 * 站长 running their own white-label site. Admin+web gated by Setting.vue.
 */
export default defineComponent({
  name: 'SiteServicesSetting',
  components: {
    ElButton,
    ElCard,
    ElTable,
    ElTableColumn,
    ElEmpty,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElSelect,
    ElOption,
    ElSwitch,
    ElTag,
    SectionNotice,
    AutoTranslateToggle
  },
  directives: {
    loading: vLoading
  },
  data() {
    return {
      Plus: markRaw(Plus),
      MARKUP_RATIO_MAX,
      siteMarkupDraftPercent: 0,
      siteMarkupConfirmedPercent: 0,
      siteMarkupSaving: false,
      pendingSiteMarkupPercent: undefined as number | undefined,
      loading: false,
      catalogLoading: false,
      submitting: false,
      deletingId: '' as string,
      rows: [] as ISiteServiceOverride[],
      catalog: [] as IService[],
      catalogMap: {} as Record<string, IService>,
      dialogVisible: false,
      editingRow: null as ISiteServiceOverride | null,
      form: emptyForm(),
      mobile: typeof window !== 'undefined' && window.innerWidth < 768
    };
  },
  computed: {
    site(): ISite {
      return this.$store.getters.site || {};
    },
    siteId(): string | undefined {
      return this.site?.id;
    },
    // Site-wide default a blank per-service markup inherits.
    siteDefaultRatio(): number {
      return getSiteMarkupRatio(this.site);
    },
    siteMarkupPercent(): number {
      return Math.round(this.siteDefaultRatio * 10000) / 100;
    },
    // Never below the loaded value so el-input-number can't silently clamp a
    // pre-existing out-of-range override down on dialog open.
    markupPercentMax(): number {
      const cur = typeof this.form.markupRatio === 'number' ? this.form.markupRatio : 0;
      return Math.max(MARKUP_RATIO_MAX, cur) * 100;
    },
    markupPercent: {
      get(): number | undefined {
        return typeof this.form.markupRatio === 'number' ? Math.round(this.form.markupRatio * 10000) / 100 : undefined;
      },
      set(value: number | undefined) {
        this.form.markupRatio = typeof value === 'number' ? value / 100 : undefined;
      }
    },
    effectiveRatio(): number {
      return typeof this.form.markupRatio === 'number' ? this.form.markupRatio : this.siteDefaultRatio;
    },
    catalogOptions(): IService[] {
      // ``private`` is already excluded server-side (see onFetchCatalog); only
      // the favicon requirement remains, so every homepage card has an icon.
      return this.catalog
        .filter((s) => !!s.icon_url)
        .sort((a, b) => {
          const at = (a.title || a.id || '').toLowerCase();
          const bt = (b.title || b.id || '').toLowerCase();
          return at < bt ? -1 : at > bt ? 1 : 0;
        });
    }
  },
  watch: {
    siteMarkupPercent: {
      immediate: true,
      handler(percent: number) {
        if (!this.siteMarkupSaving && this.pendingSiteMarkupPercent === undefined) {
          this.siteMarkupDraftPercent = percent;
          this.siteMarkupConfirmedPercent = percent;
        }
      }
    },
    siteId: {
      immediate: true,
      handler(id: string | undefined) {
        if (id) {
          this.onFetch();
          this.onFetchCatalog();
        } else {
          this.rows = [];
        }
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    onResize() {
      this.mobile = window.innerWidth < 768;
    },
    async onSaveSiteMarkup(percent: number | undefined): Promise<void> {
      if (!this.siteId) return;
      const clampedPercent = Math.min(MARKUP_RATIO_MAX * 100, Math.max(0, Number(percent) || 0));
      const normalizedPercent = Math.round(clampedPercent * 100) / 100;
      this.siteMarkupDraftPercent = normalizedPercent;
      this.pendingSiteMarkupPercent = normalizedPercent;
      if (this.siteMarkupSaving) return;

      this.siteMarkupSaving = true;
      let saveFailed = false;
      try {
        while (this.pendingSiteMarkupPercent !== undefined) {
          const nextPercent = this.pendingSiteMarkupPercent;
          this.pendingSiteMarkupPercent = undefined;
          const siteId = this.siteId;
          if (!siteId) break;
          const metadata = (this.site.metadata || {}) as Record<string, unknown>;
          await siteOperator.update(siteId, {
            ...this.site,
            metadata: {
              ...metadata,
              pricing: {
                ...((metadata.pricing as Record<string, unknown>) || {}),
                markup_ratio: nextPercent / 100
              }
            }
          });
          this.siteMarkupConfirmedPercent = nextPercent;
        }
      } catch {
        saveFailed = true;
        this.pendingSiteMarkupPercent = undefined;
        ElMessage.error(this.$t('site.services.message.saveFailed'));
        this.siteMarkupDraftPercent = this.siteMarkupConfirmedPercent;
      }

      try {
        const refreshedSite = (await this.$store.dispatch('getSite')) as ISite | undefined;
        if (refreshedSite) {
          const refreshedPercent = Math.round(getSiteMarkupRatio(refreshedSite) * 10000) / 100;
          this.siteMarkupConfirmedPercent = refreshedPercent;
          this.siteMarkupDraftPercent = refreshedPercent;
        } else if (!saveFailed) {
          ElMessage.error(this.$t('site.services.message.fetchFailed'));
          this.siteMarkupDraftPercent = this.siteMarkupConfirmedPercent;
        }
      } catch {
        if (!saveFailed) {
          ElMessage.error(this.$t('site.services.message.fetchFailed'));
        }
        this.siteMarkupDraftPercent = this.siteMarkupConfirmedPercent;
      } finally {
        this.siteMarkupSaving = false;
      }
    },
    formatMarkup(ratio: number): string {
      // 0 -> "+0%", 0.3 -> "+30%", 1.25 -> "+125%". One decimal max so
      // binary-FP drift doesn't render as "+30.0000004%".
      const pct = Math.round(ratio * 100 * 10) / 10;
      const text = Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1);
      return `+${text}%`;
    },
    catalogTitle(serviceId?: string): string {
      if (!serviceId) return '—';
      const svc = this.catalogMap[serviceId];
      return svc?.title || svc?.alias || serviceId;
    },
    catalogAlias(serviceId?: string): string | undefined {
      if (!serviceId) return undefined;
      return this.catalogMap[serviceId]?.alias;
    },
    catalogIcon(serviceId?: string): string | undefined {
      if (!serviceId) return undefined;
      return this.catalogMap[serviceId]?.icon_url || undefined;
    },
    optionLabel(svc: IService): string {
      // el-select filterable matches the label string, so concatenate
      // title + alias + id to make all three searchable.
      return [svc.title, svc.alias, svc.id].filter(Boolean).join(' ');
    },
    isAlreadyOverridden(serviceId?: string): boolean {
      if (!serviceId) return false;
      return this.rows.some((r) => r.service === serviceId && r.id !== this.editingRow?.id);
    },
    async onFetch(): Promise<void> {
      if (!this.siteId) {
        this.rows = [];
        return;
      }
      this.loading = true;
      try {
        const { data } = await siteServiceOverrideOperator.getAll({
          site: this.siteId,
          limit: CATALOG_PAGE_LIMIT,
          ordering: 'sort_order,created_at'
        });
        this.rows = data.items || [];
      } catch {
        ElMessage.error(this.$t('site.services.message.fetchFailed'));
      } finally {
        this.loading = false;
      }
    },
    async onFetchCatalog(): Promise<void> {
      if (this.catalog.length > 0) return;
      this.catalogLoading = true;
      try {
        // Filter out catalog-private services server-side (backend honours
        // ``?private=false``) so we never ship internal services to the client.
        // The favicon requirement has no server param, so it stays client-side.
        const { data } = await serviceOperator.getAll({ limit: CATALOG_PAGE_LIMIT, private: false });
        this.catalog = data.items || [];
        this.catalogMap = Object.fromEntries(this.catalog.map((s) => [s.id as string, s]));
      } catch {
        // Non-fatal: the table still renders with raw service ids.
      } finally {
        this.catalogLoading = false;
      }
    },
    onOpenCreate(): void {
      this.editingRow = null;
      this.form = emptyForm();
      this.dialogVisible = true;
    },
    onOpenEdit(row: ISiteServiceOverride): void {
      this.editingRow = row;
      this.form = {
        service: row.service || '',
        visible: row.visible !== false,
        markupRatio: typeof row.markup_ratio === 'number' ? row.markup_ratio : undefined,
        displayTitle: row.display_title_source ?? row.display_title ?? '',
        displaySummary: row.display_summary_source ?? row.display_summary ?? '',
        sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
        autoTranslatedFields: [...(row.auto_translated_fields ?? [])]
      };
      this.dialogVisible = true;
    },
    async onDisplayTitleEnabled(payload: { source: string; fieldValue: string }): Promise<void> {
      // Server now holds the literal in Translation; mirror its ``source`` so
      // the next save round-trips the same zh-cn string, and keep ``editingRow``
      // in sync so re-opening the dialog hydrates from post-toggle state.
      this.form.displayTitle = payload.source;
      this.form.autoTranslatedFields = [...new Set([...this.form.autoTranslatedFields, 'display_title'])].sort();
      if (this.editingRow) {
        this.editingRow.display_title = payload.fieldValue;
        this.editingRow.display_title_source = payload.source;
        this.editingRow.auto_translated_fields = [...this.form.autoTranslatedFields];
      }
      ElMessage.success(this.$t('site.services.message.saved'));
      // Refetch so the table renders the locale-resolved title, not the $t(...) ref.
      await this.onFetch();
    },
    async onDisplayTitleDisabled(payload: { fieldValue: string | null }): Promise<void> {
      const value = payload.fieldValue ?? '';
      this.form.displayTitle = value;
      this.form.autoTranslatedFields = this.form.autoTranslatedFields.filter((f) => f !== 'display_title');
      if (this.editingRow) {
        this.editingRow.display_title = value || null;
        this.editingRow.display_title_source = value || null;
        this.editingRow.auto_translated_fields = [...this.form.autoTranslatedFields];
      }
      ElMessage.success(this.$t('site.services.message.saved'));
      await this.onFetch();
    },
    async onDisplaySummaryEnabled(payload: { source: string; fieldValue: string }): Promise<void> {
      this.form.displaySummary = payload.source;
      this.form.autoTranslatedFields = [...new Set([...this.form.autoTranslatedFields, 'display_summary'])].sort();
      if (this.editingRow) {
        this.editingRow.display_summary = payload.fieldValue;
        this.editingRow.display_summary_source = payload.source;
        this.editingRow.auto_translated_fields = [...this.form.autoTranslatedFields];
      }
      ElMessage.success(this.$t('site.services.message.saved'));
      await this.onFetch();
    },
    async onDisplaySummaryDisabled(payload: { fieldValue: string | null }): Promise<void> {
      const value = payload.fieldValue ?? '';
      this.form.displaySummary = value;
      this.form.autoTranslatedFields = this.form.autoTranslatedFields.filter((f) => f !== 'display_summary');
      if (this.editingRow) {
        this.editingRow.display_summary = value || null;
        this.editingRow.display_summary_source = value || null;
        this.editingRow.auto_translated_fields = [...this.form.autoTranslatedFields];
      }
      ElMessage.success(this.$t('site.services.message.saved'));
      await this.onFetch();
    },
    async onSubmit(): Promise<void> {
      if (this.editingRow) {
        await this.onUpdate();
      } else {
        await this.onCreate();
      }
    },
    async onCreate(): Promise<void> {
      if (!this.siteId || !this.form.service) {
        ElMessage.error(this.$t('site.services.message.serviceRequired'));
        return;
      }
      this.submitting = true;
      try {
        await siteServiceOverrideOperator.create({
          site: this.siteId,
          service: this.form.service,
          visible: this.form.visible,
          markup_ratio: typeof this.form.markupRatio === 'number' ? this.form.markupRatio : null,
          display_title: this.form.displayTitle.trim() || null,
          display_summary: this.form.displaySummary.trim() || null,
          sort_order: typeof this.form.sortOrder === 'number' ? this.form.sortOrder : 0
        });
        ElMessage.success(this.$t('site.services.message.saved'));
        this.dialogVisible = false;
        await this.onFetch();
      } catch (err) {
        ElMessage.error(this.extractError(err) || this.$t('site.services.message.saveFailed'));
      } finally {
        this.submitting = false;
      }
    },
    async onUpdate(): Promise<void> {
      const row = this.editingRow;
      if (!row?.id) return;
      this.submitting = true;
      try {
        await siteServiceOverrideOperator.update(row.id, {
          visible: this.form.visible,
          markup_ratio: typeof this.form.markupRatio === 'number' ? this.form.markupRatio : null,
          display_title: this.form.displayTitle.trim() || null,
          display_summary: this.form.displaySummary.trim() || null,
          sort_order: typeof this.form.sortOrder === 'number' ? this.form.sortOrder : 0
        });
        ElMessage.success(this.$t('site.services.message.saved'));
        this.dialogVisible = false;
        this.editingRow = null;
        await this.onFetch();
      } catch (err) {
        ElMessage.error(this.extractError(err) || this.$t('site.services.message.saveFailed'));
      } finally {
        this.submitting = false;
      }
    },
    async onDelete(row: ISiteServiceOverride): Promise<void> {
      if (!row.id) return;
      try {
        await ElMessageBox.confirm(
          this.$t('site.services.message.deleteConfirm', { name: this.catalogTitle(row.service) }),
          this.$t('common.button.delete'),
          {
            type: 'warning',
            confirmButtonText: this.$t('common.button.delete'),
            cancelButtonText: this.$t('common.button.cancel'),
            confirmButtonClass: 'el-button--danger'
          }
        );
      } catch {
        return; // cancelled
      }
      this.deletingId = row.id;
      try {
        await siteServiceOverrideOperator.delete(row.id);
        ElMessage.success(this.$t('site.services.message.deleted'));
        await this.onFetch();
      } catch (err) {
        ElMessage.error(this.extractError(err) || this.$t('site.services.message.deleteFailed'));
      } finally {
        this.deletingId = '';
      }
    },
    extractError(err: unknown): string {
      const detail = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (detail && typeof detail === 'object') {
        return Object.values(detail).flat().filter(Boolean).join('; ');
      }
      return '';
    }
  }
});
</script>

<style lang="scss" scoped>
.site-services-settings {
  .default-price-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 12px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);

    .markup-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .markup-input {
      width: 180px;
    }

    .markup-percent {
      color: var(--el-color-primary);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 12px 0;
  }
  .settings-title {
    font-weight: 600;
  }
  .settings-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
  .list-card {
    border: 1px solid var(--el-border-color-lighter);
  }
  .overrides-table {
    width: 100%;
    .service-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      .service-favicon {
        width: 22px;
        height: 22px;
        border-radius: 4px;
        object-fit: contain;
        flex-shrink: 0;
      }
      .service-cell-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
    }
  }
  .muted {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

@media (max-width: 767px) {
  .site-services-settings {
    .default-price-section {
      align-items: flex-start;
      flex-direction: column;
      gap: 12px;

      .markup-input {
        width: min(180px, calc(100vw - 96px));
      }
    }

    .header {
      flex-direction: column;
    }
  }
}

// The nested edit dialog is appended to body, so styles for its form must be
// global rather than nested under `.site-services-settings`.
:global(.site-service-override-dialog.el-dialog),
:global(.site-service-override-dialog .el-dialog) {
  width: min(520px, calc(100vw - 32px)) !important;
}

:global(.site-service-override-dialog .service-override-form .el-form-item__label) {
  height: auto;
  line-height: 1.3;
  white-space: normal;
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:global(.site-service-override-dialog .service-override-form .field-desc) {
  display: block;
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  white-space: normal;
  color: var(--el-text-color-secondary);
}

:global(.site-service-override-dialog .service-override-form .markup-row) {
  display: flex;
  align-items: center;
  gap: 10px;
}

:global(.site-service-override-dialog .service-override-form .markup-input) {
  width: 180px;
}

:global(.site-service-override-dialog .service-override-form .markup-percent) {
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
  font-weight: 600;
}

:global(.site-service-override-dialog .service-override-form .field-tip) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:global(.site-service-override-dialog .service-override-form .auto-translate-inline) {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

:global(.service-catalog-select-popper .el-select-dropdown__item) {
  height: auto;
  min-height: 34px;
  line-height: 1.4;
}

:global(.service-catalog-select-popper .service-option) {
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
}

:global(.service-catalog-select-popper .option-favicon) {
  width: 18px;
  height: 18px;
  max-width: 18px;
  max-height: 18px;
  border-radius: 4px;
  object-fit: contain;
  flex-shrink: 0;
  margin-right: 6px;
}

:global(.service-catalog-select-popper .option-title) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.service-catalog-select-popper .option-alias) {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
</style>
