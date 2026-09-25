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
        <el-form-item :label="$t('site.homeSections.field.body')">
          <el-input v-model="form.body" type="textarea" :rows="10" :maxlength="12000" show-word-limit />
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
          <span class="field-tip">{{ $t(`site.homeSections.${form.kind}Tip`) }}</span>
        </el-form-item>

        <el-form-item v-if="form.kind === 'html'" :label="$t('site.homeSections.iframe.label')">
          <div class="iframe-option">
            <el-switch v-model="form.renderInIframe" :aria-label="$t('site.homeSections.iframe.label')" />
            <span class="field-tip">{{ $t('site.homeSections.iframe.tip') }}</span>
          </div>
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
import type { ISite, ISiteHomeSection, SiteHomeSectionKind } from '@/models';
import { siteHomeSectionOperator } from '@/operators';
import { extractApiErrorMessage } from '@/utils/apiError';

interface SectionForm {
  kind: SiteHomeSectionKind;
  title: string;
  body: string;
  renderInIframe: boolean;
  visible: boolean;
  sortOrder: number;
  startAt: string;
  endAt: string;
}

const kinds: SiteHomeSectionKind[] = ['markdown', 'html'];
const emptyForm = (): SectionForm => ({
  kind: 'markdown',
  title: '',
  body: '',
  renderInIframe: false,
  visible: true,
  sortOrder: 0,
  startAt: '',
  endAt: ''
});
const toIso = (value: string): string | null =>
  !value ? null : /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
const fromIso = (value?: string | null): string => (value ? value.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') : '');
const title = (value: string): string => value.trim();

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
    ElSwitch
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
      submitting: false,
      editing: null as ISiteHomeSection | null,
      form: emptyForm()
    };
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
    source(row: ISiteHomeSection, field: 'title' | 'body'): string {
      return row[`${field}_source`] || row[field] || '';
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
        body: this.source(row, 'body'),
        renderInIframe: row.render_in_iframe === true,
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
      return {
        kind: this.form.kind,
        title: title(this.form.title),
        body: this.form.body,
        render_in_iframe: this.form.kind === 'html' && this.form.renderInIframe,
        visible: this.form.visible,
        sort_order: this.form.sortOrder,
        start_at: toIso(this.form.startAt),
        end_at: toIso(this.form.endAt)
      };
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
      } catch (error: unknown) {
        ElMessage.error(extractApiErrorMessage(error) || this.$t('site.homeSections.saveFailed'));
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
.translation-below {
  margin-top: 6px;
}
.iframe-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
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
