<template>
  <div v-loading="loading" class="banner-settings">
    <section class="banner-section">
      <header class="section-header">
        <div>
          <h3>{{ $t('site.banner.systemTitle') }}</h3>
          <p>{{ $t('site.banner.systemTip') }}</p>
        </div>
      </header>
      <div class="system-grid">
        <article v-for="banner in HOME_BANNERS" :key="banner.id" class="system-card">
          <img :src="banner.imageUrl" :alt="$t(banner.titleKey)" />
          <div class="system-copy">
            <strong>{{ $t(banner.titleKey) }}</strong>
            <span v-if="!capabilityEnabled(banner.capability)">{{ $t('site.banner.serviceDisabled') }}</span>
          </div>
          <el-switch
            :model-value="!hiddenDefaultIds.has(banner.id)"
            :loading="savingDefaultId === banner.id"
            :aria-label="$t('site.banner.toggleSystem', { title: $t(banner.titleKey) })"
            @change="onToggleDefault(banner.id, $event as boolean)"
          />
        </article>
      </div>
    </section>

    <section class="banner-section">
      <header class="section-header">
        <div>
          <h3>{{ $t('site.banner.customTitle') }}</h3>
          <p>{{ $t('site.banner.customTip') }}</p>
        </div>
        <el-button type="primary" round :disabled="!site?.id" @click="openCreate">
          <add-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('site.banner.add') }}
        </el-button>
      </header>

      <el-empty v-if="!rows.length" :description="$t('site.banner.empty')" :image-size="72" />
      <div v-else class="custom-list">
        <article v-for="row in rows" :key="row.id" class="custom-card">
          <img v-if="row.image_url" :src="row.image_url" :alt="bannerText(row.title)" />
          <div v-else class="image-placeholder"><image-icon :size="'1.4em' as any" /></div>
          <div class="custom-copy">
            <strong>{{ bannerText(row.title) || $t('site.banner.untitled') }}</strong>
            <span v-if="bannerText(row.subtitle)">{{ bannerText(row.subtitle) }}</span>
            <small
              >{{ scheduleLabel(row) }} · {{ $t('site.banner.sortOrderValue', { value: row.sort_order ?? 0 }) }}</small
            >
          </div>
          <el-switch
            :model-value="row.visible !== false"
            :loading="busyId === row.id"
            :aria-label="$t('site.banner.toggleCustom', { title: bannerText(row.title) || $t('site.banner.untitled') })"
            @change="onToggleCustom(row, $event as boolean)"
          />
          <el-button size="small" round @click="openEdit(row)">{{ $t('common.button.edit') }}</el-button>
          <el-button size="small" round type="danger" plain :loading="deletingId === row.id" @click="onDelete(row)">
            {{ $t('common.button.delete') }}
          </el-button>
        </article>
      </div>
    </section>

    <el-dialog
      v-model="editorVisible"
      :title="editing?.id ? $t('site.banner.editTitle') : $t('site.banner.createTitle')"
      width="min(720px, 94vw)"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('site.banner.image')">
          <div class="image-editor-row">
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="" />
            <div v-else class="image-placeholder wide"><image-icon :size="'1.5em' as any" /></div>
            <div class="image-actions">
              <el-button @click="cropperVisible = true">
                <upload-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
                {{ form.imageUrl ? $t('site.banner.replaceImage') : $t('site.banner.uploadImage') }}
              </el-button>
              <el-button v-if="form.imageUrl" link type="primary" @click="form.imageUrl = ''">
                {{ $t('site.banner.clearImage') }}
              </el-button>
            </div>
          </div>
          <el-input
            v-model="form.imageUrl"
            class="url-input"
            :placeholder="$t('site.banner.imagePlaceholder')"
            clearable
          />
        </el-form-item>

        <el-form-item :label="$t('site.banner.link')">
          <el-input v-model="form.linkUrl" :placeholder="$t('site.banner.linkPlaceholder')" clearable />
          <span class="field-tip">{{ $t('site.banner.linkTip') }}</span>
        </el-form-item>

        <el-form-item :label="$t('site.banner.title')">
          <locale-rows v-model="form.titleRows" :placeholder="$t('site.banner.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('site.banner.subtitle')">
          <locale-rows v-model="form.subtitleRows" :placeholder="$t('site.banner.subtitlePlaceholder')" />
        </el-form-item>

        <div class="form-grid">
          <el-form-item :label="$t('site.banner.startAt')">
            <el-date-picker v-model="form.startAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable />
          </el-form-item>
          <el-form-item :label="$t('site.banner.endAt')">
            <el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable />
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item :label="$t('site.banner.sortOrder')">
            <el-input-number v-model="form.sortOrder" :min="-1000" :max="1000" :precision="0" />
          </el-form-item>
          <el-form-item :label="$t('site.banner.visible')">
            <el-switch v-model="form.visible" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editorVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">{{ $t('common.button.confirm') }}</el-button>
      </template>
    </el-dialog>

    <image-cropper
      v-model="cropperVisible"
      :title="$t('site.banner.cropTitle')"
      :format-hint="$t('site.banner.cropTip')"
      :aspect-ratio="16 / 5"
      :output-width="1600"
      accept="image/png,image/jpeg,image/webp"
      shape="rectangle"
      @uploaded="form.imageUrl = $event"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  vLoading
} from 'element-plus';
import { AddIcon, ImageIcon, UploadIcon } from '@acedatacloud/core/icons/components';
import ImageCropper from '@/components/common/ImageCropper.vue';
import LocaleRows, { type ILocaleRow } from '@/components/setting/LocaleRows.vue';
import { HOME_BANNERS } from '@/pages/home/data';
import { siteBannerOperator, siteOperator } from '@/operators';
import type { CapabilityKey } from '@/constants/capabilities';
import type { ISite, ISiteBanner, ISiteBannerI18nMap } from '@/models';
import { getHiddenDefaultBannerIds, resolveSiteBannerText, withHiddenDefaultBannerIds } from '@/utils/siteBanner';
import { toWritableSitePayload } from '@/utils/site';

interface IBannerForm {
  imageUrl: string;
  linkUrl: string;
  titleRows: ILocaleRow[];
  subtitleRows: ILocaleRow[];
  visible: boolean;
  sortOrder: number;
  startAt: string;
  endAt: string;
}

const emptyForm = (): IBannerForm => ({
  imageUrl: '',
  linkUrl: '',
  titleRows: [],
  subtitleRows: [],
  visible: true,
  sortOrder: 0,
  startAt: '',
  endAt: ''
});

const mapToRows = (map?: ISiteBannerI18nMap): ILocaleRow[] =>
  map ? Object.entries(map).map(([locale, value]) => ({ locale, value })) : [];

const rowsToMap = (rows: ILocaleRow[]): ISiteBannerI18nMap => {
  const entries = rows
    .map(({ locale, value }) => [locale.trim(), value.trim()])
    .filter(([locale, value]) => locale && value);
  return entries.length ? Object.fromEntries(entries) : null;
};

const toIso = (value: string): string | null => {
  if (!value) return null;
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
};

const fromIso = (value?: string | null): string => (value ? value.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') : '');

export default defineComponent({
  name: 'BannersSetting',
  components: {
    AddIcon,
    ElButton,
    ElDatePicker,
    ElDialog,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElSwitch,
    ImageCropper,
    ImageIcon,
    LocaleRows,
    UploadIcon
  },
  directives: { loading: vLoading },
  props: {
    site: { type: Object as PropType<ISite | undefined>, default: undefined }
  },
  data() {
    return {
      HOME_BANNERS,
      rows: [] as ISiteBanner[],
      loading: false,
      savingDefaultId: '',
      busyId: '',
      deletingId: '',
      editorVisible: false,
      cropperVisible: false,
      submitting: false,
      editing: null as ISiteBanner | null,
      form: emptyForm()
    };
  },
  computed: {
    hiddenDefaultIds(): Set<string> {
      return getHiddenDefaultBannerIds(this.site);
    }
  },
  watch: {
    'site.id': {
      immediate: true,
      handler(id: string | undefined) {
        if (id) void this.fetchRows();
        else this.rows = [];
      }
    }
  },
  methods: {
    capabilityEnabled(capability: CapabilityKey): boolean {
      return this.site?.features?.[capability]?.enabled === true;
    },
    bannerText(map?: ISiteBannerI18nMap): string {
      return resolveSiteBannerText(map, String(this.$i18n.locale || 'en'));
    },
    scheduleLabel(row: ISiteBanner): string {
      const now = Date.now();
      const start = row.start_at ? Date.parse(row.start_at) : undefined;
      const end = row.end_at ? Date.parse(row.end_at) : undefined;
      if (start !== undefined && now < start) return this.$t('site.banner.scheduled') as string;
      if (end !== undefined && now >= end) return this.$t('site.banner.expired') as string;
      return row.visible === false
        ? (this.$t('site.banner.hidden') as string)
        : (this.$t('site.banner.active') as string);
    },
    async fetchRows() {
      if (!this.site?.id) return;
      this.loading = true;
      try {
        const { data } = await siteBannerOperator.getAll({
          site: this.site.id,
          ordering: 'sort_order,created_at',
          limit: 100
        });
        this.rows = data.items || [];
      } catch {
        ElMessage.error(this.$t('site.banner.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    async onToggleDefault(id: string, shown: boolean) {
      if (!this.site?.id) return;
      const hidden = new Set(this.hiddenDefaultIds);
      if (shown) hidden.delete(id);
      else hidden.add(id);
      this.savingDefaultId = id;
      try {
        const payload = toWritableSitePayload(this.site);
        payload.metadata = withHiddenDefaultBannerIds(this.site.metadata, hidden);
        await siteOperator.update(this.site.id, payload);
        await this.$store.dispatch('getSite');
      } catch {
        ElMessage.error(this.$t('site.banner.updateFailed'));
      } finally {
        this.savingDefaultId = '';
      }
    },
    async onToggleCustom(row: ISiteBanner, visible: boolean) {
      if (!row.id) return;
      this.busyId = row.id;
      try {
        const { data } = await siteBannerOperator.update(row.id, { visible });
        this.rows = this.rows.map((item) => (item.id === row.id ? data : item));
      } catch {
        ElMessage.error(this.$t('site.banner.updateFailed'));
      } finally {
        this.busyId = '';
      }
    },
    openCreate() {
      this.editing = null;
      this.form = emptyForm();
      this.form.titleRows = [{ locale: String(this.$i18n.locale || 'en'), value: '' }];
      this.editorVisible = true;
    },
    openEdit(row: ISiteBanner) {
      this.editing = row;
      this.form = {
        imageUrl: row.image_url || '',
        linkUrl: row.link_url || '',
        titleRows: mapToRows(row.title),
        subtitleRows: mapToRows(row.subtitle),
        visible: row.visible !== false,
        sortOrder: row.sort_order ?? 0,
        startAt: fromIso(row.start_at),
        endAt: fromIso(row.end_at)
      };
      this.editorVisible = true;
    },
    buildPayload() {
      return {
        image_url: this.form.imageUrl.trim() || null,
        link_url: this.form.linkUrl.trim() || null,
        title: rowsToMap(this.form.titleRows),
        subtitle: rowsToMap(this.form.subtitleRows),
        visible: this.form.visible,
        sort_order: this.form.sortOrder,
        start_at: toIso(this.form.startAt),
        end_at: toIso(this.form.endAt)
      };
    },
    async onSubmit() {
      if (!this.site?.id) return;
      const start = toIso(this.form.startAt);
      const end = toIso(this.form.endAt);
      if (start && end && Date.parse(start) >= Date.parse(end)) {
        ElMessage.error(this.$t('site.banner.invalidWindow'));
        return;
      }
      this.submitting = true;
      try {
        if (this.editing?.id) await siteBannerOperator.update(this.editing.id, this.buildPayload());
        else await siteBannerOperator.create({ site: this.site.id, ...this.buildPayload() });
        this.editorVisible = false;
        await this.fetchRows();
        ElMessage.success(this.$t('common.message.saved'));
      } catch (error: any) {
        const data = error?.response?.data;
        const detail = data && typeof data === 'object' ? Object.values(data).flat().join('; ') : '';
        ElMessage.error(detail || this.$t('site.banner.saveFailed'));
      } finally {
        this.submitting = false;
      }
    },
    async onDelete(row: ISiteBanner) {
      if (!row.id) return;
      try {
        await ElMessageBox.confirm(
          this.$t('site.banner.deleteConfirm', {
            title: this.bannerText(row.title) || this.$t('site.banner.untitled')
          }) as string,
          this.$t('common.button.delete') as string,
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.deletingId = row.id;
      try {
        await siteBannerOperator.delete(row.id);
        this.rows = this.rows.filter((item) => item.id !== row.id);
      } catch {
        ElMessage.error(this.$t('site.banner.deleteFailed'));
      } finally {
        this.deletingId = '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.banner-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.banner-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.section-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
}
.section-header p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.system-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.system-card,
.custom-card {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.system-card img {
  width: 84px;
  height: 48px;
  border-radius: 7px;
  object-fit: cover;
}
.system-copy,
.custom-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.system-copy strong,
.custom-copy strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.system-copy span,
.custom-copy span,
.custom-copy small {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.custom-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.custom-card > img,
.image-placeholder {
  flex: 0 0 auto;
  width: 112px;
  height: 56px;
  border-radius: 7px;
  object-fit: cover;
}
.image-placeholder {
  display: grid;
  place-items: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}
.image-placeholder.wide,
.image-editor-row > img {
  width: 240px;
  height: 75px;
  border-radius: 8px;
  object-fit: cover;
}
.image-editor-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.image-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.url-input {
  margin-top: 8px;
}
.field-tip {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 760px) {
  .system-grid {
    grid-template-columns: 1fr;
  }
  .custom-card {
    flex-wrap: wrap;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
