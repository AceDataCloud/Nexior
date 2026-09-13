<template>
  <section v-loading="loading" class="home-section-settings">
    <header class="section-header">
      <div>
        <h3>{{ $t('site.homeSections.title') }}</h3>
        <p>{{ $t('site.homeSections.tip') }}</p>
      </div>
      <el-button type="primary" round :disabled="!site?.id" @click="openCreate">
        <add-icon :size="'1em' as any" /> {{ $t('site.homeSections.add') }}
      </el-button>
    </header>

    <el-empty v-if="!rows.length" :description="$t('site.homeSections.empty')" :image-size="72" />
    <div v-else class="section-list">
      <article v-for="(row, index) in rows" :key="row.id" class="section-row">
        <div class="section-copy">
          <strong>{{ source(row, 'title') || $t(`site.homeSections.kind.${row.kind}`) }}</strong>
          <span>{{ $t(`site.homeSections.kind.${row.kind}`) }} · {{ statusLabel(row) }}</span>
        </div>
        <el-switch
          :model-value="row.visible !== false"
          :loading="busyId === row.id"
          @change="toggleVisible(row, $event as boolean)"
        />
        <el-button
          size="small"
          circle
          :disabled="index === 0 || busyId === row.id"
          :aria-label="$t('site.homeSections.moveUp')"
          @click="move(row, index, -1)"
          >↑</el-button
        >
        <el-button
          size="small"
          circle
          :disabled="index === rows.length - 1 || busyId === row.id"
          :aria-label="$t('site.homeSections.moveDown')"
          @click="move(row, index, 1)"
          >↓</el-button
        >
        <el-button size="small" round @click="openEdit(row)">{{ $t('common.button.edit') }}</el-button>
        <el-button size="small" round type="danger" plain :loading="deletingId === row.id" @click="remove(row)">{{
          $t('common.button.delete')
        }}</el-button>
      </article>
    </div>

    <el-dialog
      v-model="editorVisible"
      :title="$t(editing?.id ? 'site.homeSections.edit' : 'site.homeSections.create')"
      width="min(720px, 94vw)"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-position="top" @submit.prevent>
        <el-form-item :label="$t('site.homeSections.kindLabel')">
          <el-select v-model="form.kind" :disabled="Boolean(editing?.id)" class="full-width">
            <el-option v-for="kind in kinds" :key="kind" :label="$t(`site.homeSections.kind.${kind}`)" :value="kind" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('site.homeSections.field.title')">
          <el-input v-model="form.title" maxlength="160">
            <template #suffix
              ><auto-translate-toggle
                model="site_home_section"
                field="title"
                :object-id="editing?.id"
                :enabled="translationEnabled('title')"
                :current-value="form.title"
                :disabled-reason="$t('site.homeSections.saveBeforeTranslate')"
                @enabled-success="onTranslationChanged()"
                @disabled-success="onTranslationChanged()"
            /></template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="form.kind !== 'rich_text'" :label="$t('site.homeSections.field.subtitle')">
          <el-input v-model="form.subtitle" maxlength="300">
            <template #suffix
              ><auto-translate-toggle
                model="site_home_section"
                field="subtitle"
                :object-id="editing?.id"
                :enabled="translationEnabled('subtitle')"
                :current-value="form.subtitle"
                :disabled-reason="$t('site.homeSections.saveBeforeTranslate')"
                @enabled-success="onTranslationChanged()"
                @disabled-success="onTranslationChanged()"
            /></template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="form.kind !== 'capability_grid'" :label="$t('site.homeSections.field.body')">
          <el-input
            v-model="form.body"
            type="textarea"
            :rows="form.kind === 'rich_text' ? 8 : 4"
            :maxlength="form.kind === 'rich_text' ? 12000 : 2000"
            show-word-limit
          />
          <auto-translate-toggle
            class="translation-below"
            model="site_home_section"
            field="body"
            :object-id="editing?.id"
            :enabled="translationEnabled('body')"
            :current-value="form.body"
            :disabled-reason="$t('site.homeSections.saveBeforeTranslate')"
            @enabled-success="onTranslationChanged()"
            @disabled-success="onTranslationChanged()"
          />
          <span v-if="form.kind === 'rich_text'" class="field-tip">{{ $t('site.homeSections.markdownTip') }}</span>
        </el-form-item>

        <template v-if="form.kind === 'image_text'">
          <el-form-item :label="$t('site.homeSections.field.image')">
            <div class="image-row">
              <img v-if="form.imageUrl" :src="form.imageUrl" alt="" />
              <el-button @click="cropperVisible = true">{{ $t('site.homeSections.uploadImage') }}</el-button>
            </div>
            <el-input v-model="form.imageUrl" clearable />
          </el-form-item>
        </template>

        <template v-if="form.kind === 'image_text' || form.kind === 'cta'">
          <el-form-item :label="$t('site.homeSections.field.buttonLabel')">
            <el-input v-model="form.buttonLabel" maxlength="80">
              <template #suffix
                ><auto-translate-toggle
                  model="site_home_section"
                  field="button_label"
                  :object-id="editing?.id"
                  :enabled="translationEnabled('button_label')"
                  :current-value="form.buttonLabel"
                  :disabled-reason="$t('site.homeSections.saveBeforeTranslate')"
                  @enabled-success="onTranslationChanged()"
                  @disabled-success="onTranslationChanged()"
              /></template>
            </el-input>
          </el-form-item>
          <el-form-item :label="$t('site.homeSections.field.buttonUrl')">
            <el-input v-model="form.buttonUrl" :placeholder="$t('site.homeSections.urlTip')" />
          </el-form-item>
        </template>

        <el-form-item v-if="form.kind === 'capability_grid'" :label="$t('site.homeSections.field.capabilities')">
          <el-select v-model="form.capabilityKeys" multiple filterable class="full-width" :multiple-limit="12">
            <el-option v-for="item in capabilityOptions" :key="item.key" :label="item.name" :value="item.key" />
          </el-select>
        </el-form-item>

        <div class="form-grid">
          <el-form-item :label="$t('site.homeSections.field.startAt')"
            ><el-date-picker v-model="form.startAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable
          /></el-form-item>
          <el-form-item :label="$t('site.homeSections.field.endAt')"
            ><el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" clearable
          /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item :label="$t('site.homeSections.field.order')"
            ><el-input-number v-model="form.sortOrder" :min="-100000" :max="100000" :precision="0"
          /></el-form-item>
          <el-form-item :label="$t('site.homeSections.field.visible')"
            ><el-switch v-model="form.visible"
          /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ $t('common.button.confirm') }}</el-button>
      </template>
    </el-dialog>

    <image-cropper
      v-model="cropperVisible"
      :title="$t('site.homeSections.uploadImage')"
      :aspect-ratio="16 / 9"
      :output-width="1280"
      accept="image/png,image/jpeg,image/webp"
      shape="rectangle"
      @uploaded="form.imageUrl = $event"
    />
  </section>
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
  ElOption,
  ElSelect,
  ElSwitch,
  vLoading
} from 'element-plus';
import { AddIcon } from '@acedatacloud/core/icons/components';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import ImageCropper from '@/components/common/ImageCropper.vue';
import type { ISite, ISiteHomeSection, SiteHomeSectionKind } from '@/models';
import { siteHomeSectionOperator } from '@/operators';
import { HOME_CAPABILITY_DEFINITIONS } from '@/pages/home/data';

interface SectionForm {
  kind: SiteHomeSectionKind;
  title: string;
  subtitle: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  imageUrl: string;
  capabilityKeys: string[];
  visible: boolean;
  sortOrder: number;
  startAt: string;
  endAt: string;
}

const kinds: SiteHomeSectionKind[] = ['image_text', 'cta', 'capability_grid', 'rich_text'];
const emptyForm = (): SectionForm => ({
  kind: 'image_text',
  title: '',
  subtitle: '',
  body: '',
  buttonLabel: '',
  buttonUrl: '',
  imageUrl: '',
  capabilityKeys: [],
  visible: true,
  sortOrder: 0,
  startAt: '',
  endAt: ''
});
const toIso = (value: string): string | null =>
  !value ? null : /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
const fromIso = (value?: string | null): string => (value ? value.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') : '');
const text = (value: string): string | null => value.trim() || null;

export default defineComponent({
  name: 'HomeSectionsSetting',
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
    AutoTranslateToggle,
    ElOption,
    ElSelect,
    ElSwitch,
    ImageCropper
  },
  directives: { loading: vLoading },
  props: { site: { type: Object as PropType<ISite | undefined>, default: undefined } },
  data() {
    return {
      kinds,
      rows: [] as ISiteHomeSection[],
      loading: false,
      busyId: '',
      deletingId: '',
      editorVisible: false,
      cropperVisible: false,
      submitting: false,
      editing: null as ISiteHomeSection | null,
      form: emptyForm()
    };
  },
  computed: {
    capabilityOptions(): Array<{ key: string; name: string }> {
      return [...HOME_CAPABILITY_DEFINITIONS].map(([key, item]) => ({ key, name: item.defaultName }));
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
    source(row: ISiteHomeSection, field: 'title' | 'subtitle' | 'body' | 'button_label'): string {
      return (row[`${field}_source` as keyof ISiteHomeSection] as string) || row[field] || '';
    },
    statusLabel(row: ISiteHomeSection): string {
      const now = Date.now();
      if (row.start_at && Date.parse(row.start_at) > now) return this.$t('site.homeSections.scheduled') as string;
      if (row.end_at && Date.parse(row.end_at) <= now) return this.$t('site.homeSections.expired') as string;
      return this.$t(row.visible === false ? 'site.homeSections.hidden' : 'site.homeSections.active') as string;
    },
    async fetchRows(): Promise<void> {
      if (!this.site?.id) return;
      this.loading = true;
      try {
        const { data } = await siteHomeSectionOperator.getAll({
          site: this.site.id,
          ordering: 'sort_order,created_at',
          limit: 100
        });
        this.rows = data.items || [];
      } catch {
        ElMessage.error(this.$t('site.homeSections.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    openCreate(): void {
      this.editing = null;
      this.form = emptyForm();
      this.editorVisible = true;
    },
    openEdit(row: ISiteHomeSection): void {
      this.editing = row;
      this.form = {
        kind: row.kind,
        title: this.source(row, 'title'),
        subtitle: this.source(row, 'subtitle'),
        body: this.source(row, 'body'),
        buttonLabel: this.source(row, 'button_label'),
        buttonUrl: row.button_url || '',
        imageUrl: row.image_url || '',
        capabilityKeys: [...(row.capability_keys || [])],
        visible: row.visible !== false,
        sortOrder: row.sort_order ?? 0,
        startAt: fromIso(row.start_at),
        endAt: fromIso(row.end_at)
      };
      this.editorVisible = true;
    },
    translationEnabled(field: string): boolean {
      return this.editing?.auto_translated_fields?.includes(field) === true;
    },
    async onTranslationChanged(): Promise<void> {
      const id = this.editing?.id;
      await this.fetchRows();
      const refreshed = this.rows.find((row) => row.id === id);
      if (refreshed) this.openEdit(refreshed);
    },
    buildPayload() {
      const common = {
        kind: this.form.kind,
        title: text(this.form.title),
        subtitle: this.form.kind === 'rich_text' ? null : text(this.form.subtitle),
        body: ['image_text', 'cta', 'rich_text'].includes(this.form.kind) ? text(this.form.body) : null,
        button_label: ['image_text', 'cta'].includes(this.form.kind) ? text(this.form.buttonLabel) : null,
        button_url: ['image_text', 'cta'].includes(this.form.kind) ? text(this.form.buttonUrl) : null,
        image_url: this.form.kind === 'image_text' ? text(this.form.imageUrl) : null,
        capability_keys: this.form.kind === 'capability_grid' ? this.form.capabilityKeys : [],
        visible: this.form.visible,
        sort_order: this.form.sortOrder,
        start_at: toIso(this.form.startAt),
        end_at: toIso(this.form.endAt)
      };
      return common;
    },
    async submit(): Promise<void> {
      if (!this.site?.id) return;
      const start = toIso(this.form.startAt);
      const end = toIso(this.form.endAt);
      if (start && end && Date.parse(start) >= Date.parse(end)) {
        ElMessage.error(this.$t('site.homeSections.invalidWindow'));
        return;
      }
      this.submitting = true;
      try {
        const response = this.editing?.id
          ? await siteHomeSectionOperator.update(this.editing.id, this.buildPayload())
          : await siteHomeSectionOperator.create({ site: this.site.id, ...this.buildPayload() });
        await this.fetchRows();
        this.openEdit(this.rows.find((row) => row.id === response.data.id) || response.data);
        ElMessage.success(this.$t('common.message.saved'));
      } catch (error: any) {
        const data = error?.response?.data;
        const detail = data && typeof data === 'object' ? Object.values(data).flat().join('; ') : '';
        ElMessage.error(detail || this.$t('site.homeSections.saveFailed'));
      } finally {
        this.submitting = false;
      }
    },
    async toggleVisible(row: ISiteHomeSection, visible: boolean): Promise<void> {
      if (!row.id) return;
      this.busyId = row.id;
      try {
        await siteHomeSectionOperator.update(row.id, { visible });
        await this.fetchRows();
      } catch {
        ElMessage.error(this.$t('site.homeSections.saveFailed'));
      } finally {
        this.busyId = '';
      }
    },
    async move(row: ISiteHomeSection, index: number, direction: -1 | 1): Promise<void> {
      if (!row.id) return;
      const target = this.rows[index + direction];
      if (!target) return;
      this.busyId = row.id;
      try {
        await siteHomeSectionOperator.update(row.id, { sort_order: (target.sort_order ?? 0) + direction });
        await this.fetchRows();
      } catch {
        await this.fetchRows();
        ElMessage.error(this.$t('site.homeSections.reorderFailed'));
      } finally {
        this.busyId = '';
      }
    },
    async remove(row: ISiteHomeSection): Promise<void> {
      if (!row.id) return;
      try {
        await ElMessageBox.confirm(
          this.$t('site.homeSections.deleteConfirm') as string,
          this.$t('common.button.delete') as string,
          { type: 'warning' }
        );
      } catch {
        return;
      }
      this.deletingId = row.id;
      try {
        await siteHomeSectionOperator.delete(row.id);
        await this.fetchRows();
      } catch {
        ElMessage.error(this.$t('site.homeSections.deleteFailed'));
      } finally {
        this.deletingId = '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.home-section-settings,
.section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-header,
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.section-header {
  align-items: flex-start;
}
.section-header h3 {
  margin: 0;
  font-size: 15px;
}
.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.section-row {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.section-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
.section-copy strong,
.section-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.section-copy span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.full-width {
  width: 100%;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.image-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
}
.image-row img {
  width: 180px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}
.translation-below {
  margin-top: 6px;
}
.field-tip {
  display: block;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
@media (max-width: 760px) {
  .section-row {
    flex-wrap: wrap;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
