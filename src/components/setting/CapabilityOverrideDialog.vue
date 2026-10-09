<template>
  <el-dialog
    v-model="visible"
    :title="$t('site.capabilityOverride.dialogTitle', { name: defaultName })"
    :width="mobile ? '94vw' : '520px'"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form label-position="top" @submit.prevent>
      <el-form-item :label="$t('site.capabilityOverride.displayName')">
        <el-input v-model="displayName" maxlength="120" show-word-limit clearable>
          <template #suffix>
            <auto-translate-toggle
              model="site_capability_override"
              field="display_name"
              :object-id="record?.id"
              :enabled="autoTranslatedFields.includes('display_name')"
              :current-value="displayName"
              @enabled-success="onTranslationEnabled"
              @disabled-success="onTranslationDisabled"
            />
          </template>
        </el-input>
        <div class="field-tip">{{ $t('site.capabilityOverride.displayNameTip', { name: defaultName }) }}</div>
      </el-form-item>

      <el-form-item :label="$t('site.capabilityOverride.icon')">
        <div class="icon-comparison">
          <div class="icon-preview-block">
            <span class="preview-label">{{ $t('site.capabilityOverride.defaultIcon') }}</span>
            <img :src="defaultIcon" class="icon-preview" alt="" />
          </div>
          <div class="icon-preview-block">
            <span class="preview-label">{{ $t('site.capabilityOverride.currentIcon') }}</span>
            <img :src="iconUrl || defaultIcon" class="icon-preview" alt="" />
          </div>
          <div class="icon-actions">
            <el-button @click="iconEditorVisible = true">
              <UploadIcon :size="'1em' as any" aria-hidden="true" focusable="false" />
              {{ iconUrl ? $t('site.capabilityOverride.replaceIcon') : $t('site.capabilityOverride.uploadIcon') }}
            </el-button>
            <el-button v-if="iconUrl" link type="primary" @click="iconUrl = ''">
              {{ $t('site.capabilityOverride.useDefaultIcon') }}
            </el-button>
          </div>
        </div>
        <div class="field-tip">{{ $t('site.capabilityOverride.iconTip') }}</div>
      </el-form-item>

      <template v-if="aliasModels.length">
        <el-divider />
        <h3 class="section-title">{{ $t('site.capabilityOverride.modelNamesTitle') }}</h3>
        <div class="field-tip model-names-tip">{{ $t('site.capabilityOverride.modelNamesTip') }}</div>
        <div class="field-tip model-visibility-tip">{{ $t('site.capabilityOverride.modelVisibilityTip') }}</div>
        <div class="model-name-list">
          <div v-for="model in aliasModels" :key="model.name" class="model-name-row">
            <div class="model-name-default">
              <img :src="model.icon" alt="" />
              <div>
                <strong>{{ model.getDisplayName() }}</strong>
                <small>{{ model.name }}</small>
              </div>
            </div>
            <div class="model-customization">
              <el-input
                v-model="modelAliasDrafts[model.name]"
                clearable
                maxlength="120"
                :placeholder="$t('site.capabilityOverride.modelNamePlaceholder')"
              />
              <div class="model-icon-actions">
                <img :src="modelIconDrafts[model.name] || model.icon" class="model-icon-preview" alt="" />
                <el-button link type="primary" @click="editModelIcon(model.name)">
                  {{
                    modelIconDrafts[model.name]
                      ? $t('site.capabilityOverride.modelReplaceIcon')
                      : $t('site.capabilityOverride.modelUploadIcon')
                  }}
                </el-button>
                <el-button v-if="modelIconDrafts[model.name]" link @click="modelIconDrafts[model.name] = ''">
                  {{ $t('site.capabilityOverride.modelDefaultIcon') }}
                </el-button>
              </div>
              <label class="model-visibility">
                <span>{{ $t('site.capabilityOverride.modelVisible') }}</span>
                <el-switch
                  v-model="modelVisibilityDrafts[model.name]"
                  :aria-label="`${model.getDisplayName()}: ${$t('site.capabilityOverride.modelVisible')}`"
                />
              </label>
            </div>
          </div>
        </div>
      </template>

      <template v-if="supportsAssistant">
        <el-divider />
        <h3 class="section-title">{{ $t('site.capabilityOverride.assistantTitle') }}</h3>
        <el-form-item :label="$t('site.capabilityOverride.instructions')">
          <el-input
            v-model="instructions"
            type="textarea"
            :rows="7"
            maxlength="16000"
            show-word-limit
            :placeholder="$t('site.capabilityOverride.instructionsPlaceholder')"
          />
          <div class="field-tip">{{ $t('site.capabilityOverride.instructionsTip') }}</div>
        </el-form-item>
        <el-form-item :label="$t('site.capabilityOverride.skills')">
          <skill-picker v-model="skills" :site-id="siteId" />
          <div class="field-tip">{{ $t('site.capabilityOverride.skillsTip') }}</div>
        </el-form-item>
      </template>
    </el-form>

    <image-cropper
      v-model="iconEditorVisible"
      :title="$t('site.capabilityOverride.editIcon')"
      :format-hint="$t('site.capabilityOverride.iconTip')"
      :aspect-ratio="1"
      :output-width="512"
      accept="image/png,image/jpeg,image/webp"
      shape="rectangle"
      @uploaded="iconUrl = $event"
    />

    <image-cropper
      v-model="modelIconEditorVisible"
      :title="$t('site.capabilityOverride.editModelIcon')"
      :format-hint="$t('site.capabilityOverride.iconTip')"
      :aspect-ratio="1"
      :output-width="512"
      accept="image/png,image/jpeg,image/webp"
      shape="rectangle"
      @uploaded="onModelIconUploaded"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="record?.id" type="danger" plain :loading="resetting" @click="onReset">
          {{ $t('site.capabilityOverride.resetAll') }}
        </el-button>
        <span class="footer-spacer" />
        <el-button @click="visible = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="onSave">
          {{ $t('common.button.confirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import {
  ElButton,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSwitch
} from 'element-plus';
import { UploadIcon } from '@acedatacloud/core/icons/components';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import ImageCropper from '@/components/common/ImageCropper.vue';
import { siteCapabilityOverrideOperator } from '@/operators';
import type { IChatModelGroup, ISite, ISiteAssistantSkillBinding, ISiteCapabilityOverride } from '@/models';
import { siteOperator } from '@/operators/site';
import SkillPicker from '@/components/skill/SkillPicker.vue';
import type { CapabilityKey } from '@/constants/capabilities';
import { extractApiErrorMessage } from '@/utils/apiError';

export default defineComponent({
  name: 'CapabilityOverrideDialog',
  components: {
    AutoTranslateToggle,
    ElButton,
    ElDialog,
    ElDivider,
    ElForm,
    ElFormItem,
    ElInput,
    ElSwitch,
    ImageCropper,
    SkillPicker,
    UploadIcon
  },
  props: {
    modelValue: { type: Boolean, default: false },
    siteId: { type: String, required: true },
    capability: { type: String as PropType<CapabilityKey>, required: true },
    defaultName: { type: String, required: true },
    defaultIcon: { type: String, required: true },
    override: { type: Object as PropType<ISiteCapabilityOverride | null>, default: null },
    modelGroup: { type: Object as PropType<IChatModelGroup | null>, default: null },
    site: { type: Object as PropType<ISite>, default: () => ({ features: {} }) }
  },
  emits: ['update:modelValue', 'saved', 'refresh-needed'],
  data() {
    return {
      record: null as ISiteCapabilityOverride | null,
      displayName: '',
      iconUrl: '',
      instructions: '',
      skills: [] as ISiteAssistantSkillBinding[],
      modelAliasDrafts: {} as Record<string, string>,
      modelIconDrafts: {} as Record<string, string>,
      modelVisibilityDrafts: {} as Record<string, boolean>,
      editingModelIcon: '' as string,
      modelIconEditorVisible: false,
      autoTranslatedFields: [] as string[],
      iconEditorVisible: false,
      submitting: false,
      resetting: false
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      }
    },
    mobile(): boolean {
      return typeof window !== 'undefined' && window.innerWidth < 640;
    },
    supportsAssistant(): boolean {
      return ['chatgpt', 'claude', 'gemini', 'grok', 'deepseek', 'kimi', 'glm'].includes(this.capability);
    },
    aliasModels(): IChatModelGroup['models'] {
      return (this.modelGroup?.models ?? []).filter((model) => model.enabled !== false);
    }
  },
  watch: {
    modelValue(open: boolean) {
      if (open) this.hydrate();
    },
    override() {
      if (this.modelValue) this.hydrate();
    }
  },
  mounted() {
    if (this.modelValue) this.hydrate();
  },
  methods: {
    hydrate(): void {
      this.record = this.override ? { ...this.override } : null;
      this.displayName = this.override?.display_name_source ?? this.override?.display_name ?? '';
      this.iconUrl = this.override?.icon_url ?? '';
      const assistant = this.site.features?.[this.capability]?.assistant;
      this.instructions = assistant?.instructions ?? '';
      this.skills = [...(assistant?.skills ?? [])];
      const models = this.site.features?.[this.capability]?.models ?? {};
      this.modelAliasDrafts = Object.fromEntries(
        this.aliasModels.map((model) => [model.name, models[model.name]?.display_name ?? ''])
      );
      this.modelIconDrafts = Object.fromEntries(
        this.aliasModels.map((model) => [model.name, models[model.name]?.icon_url ?? ''])
      );
      this.modelVisibilityDrafts = Object.fromEntries(
        this.aliasModels.map((model) => [model.name, models[model.name]?.visible !== false])
      );
      this.editingModelIcon = '';
      this.modelIconEditorVisible = false;
      this.autoTranslatedFields = [...(this.override?.auto_translated_fields ?? [])];
      this.iconEditorVisible = false;
    },
    editModelIcon(modelId: string): void {
      this.editingModelIcon = modelId;
      this.modelIconEditorVisible = true;
    },
    onModelIconUploaded(url: string): void {
      if (this.editingModelIcon) this.modelIconDrafts[this.editingModelIcon] = url;
      this.editingModelIcon = '';
    },
    extractError(error: unknown): string {
      return extractApiErrorMessage(error);
    },
    async saveSiteConfiguration(): Promise<ISite | null> {
      if ((!this.supportsAssistant && !this.aliasModels.length) || !this.site.id) return null;
      const feature = this.site.features?.[this.capability] || {};
      const models = { ...(feature.models ?? {}) };
      for (const model of this.aliasModels) {
        const displayName = (this.modelAliasDrafts[model.name] ?? '').trim();
        const iconUrl = (this.modelIconDrafts[model.name] ?? '').trim();
        const updatedModel = { ...(models[model.name] ?? {}) };
        if (displayName) updatedModel.display_name = displayName;
        else delete updatedModel.display_name;
        if (iconUrl) updatedModel.icon_url = iconUrl;
        else delete updatedModel.icon_url;
        if (this.modelVisibilityDrafts[model.name] === false) updatedModel.visible = false;
        else delete updatedModel.visible;
        if (Object.keys(updatedModel).length) models[model.name] = updatedModel;
        else delete models[model.name];
      }

      const updatedFeature = { ...feature };
      if (this.supportsAssistant) {
        updatedFeature.assistant = { instructions: this.instructions.trim(), skills: this.skills };
      }
      if (Object.keys(models).length) updatedFeature.models = models;
      else delete updatedFeature.models;

      const { data } = await siteOperator.update(
        this.site.id,
        {
          features: {
            ...(this.site.features || {}),
            [this.capability]: updatedFeature
          }
        },
        this.site.configuration_revision
      );
      return data;
    },
    async onSave(): Promise<void> {
      if (
        this.aliasModels.length &&
        this.aliasModels.every((model) => this.modelVisibilityDrafts[model.name] === false)
      ) {
        ElMessage.warning(this.$t('site.capabilityOverride.modelAtLeastOne') as string);
        return;
      }
      const displayName = this.displayName.trim() || null;
      const iconUrl = this.iconUrl.trim() || null;
      this.submitting = true;
      let updatedSite: ISite | null = null;
      try {
        let createdAppearance = false;
        updatedSite = await this.saveSiteConfiguration();
        if (!displayName && !iconUrl) {
          if (this.record?.id) await siteCapabilityOverrideOperator.delete(this.record.id);
        } else if (this.record?.id) {
          const { data } = await siteCapabilityOverrideOperator.update(this.record.id, {
            display_name: displayName,
            icon_url: iconUrl
          });
          this.record = data;
        } else {
          const { data } = await siteCapabilityOverrideOperator.create({
            site: this.siteId,
            capability: this.capability,
            display_name: displayName,
            icon_url: iconUrl
          });
          this.record = data;
          this.displayName = data.display_name_source ?? data.display_name ?? '';
          this.iconUrl = data.icon_url ?? '';
          this.autoTranslatedFields = [...(data.auto_translated_fields ?? [])];
          createdAppearance = true;
        }
        ElMessage.success(this.$t('site.capabilityOverride.saved') as string);
        this.$emit('saved', updatedSite ?? undefined);
        if (!createdAppearance) this.visible = false;
      } catch (error: any) {
        if (updatedSite?.id) this.$emit('saved', updatedSite);
        if (error?.response?.status === 409 || error?.response?.status === 412) {
          this.$emit('refresh-needed');
        }
        ElMessage.error(this.extractError(error) || (this.$t('site.capabilityOverride.saveFailed') as string));
      } finally {
        this.submitting = false;
      }
    },
    async onReset(): Promise<void> {
      if (!this.record?.id) return;
      try {
        await ElMessageBox.confirm(
          this.$t('site.capabilityOverride.resetConfirm', { name: this.defaultName }) as string,
          this.$t('site.capabilityOverride.resetAll') as string,
          {
            type: 'warning',
            confirmButtonText: this.$t('site.capabilityOverride.resetAll') as string,
            cancelButtonText: this.$t('common.button.cancel') as string
          }
        );
      } catch {
        return;
      }
      this.resetting = true;
      try {
        await siteCapabilityOverrideOperator.delete(this.record.id);
        ElMessage.success(this.$t('site.capabilityOverride.resetDone') as string);
        this.$emit('saved');
        this.visible = false;
      } catch (error) {
        ElMessage.error(this.extractError(error) || (this.$t('site.capabilityOverride.saveFailed') as string));
      } finally {
        this.resetting = false;
      }
    },
    async onTranslationEnabled(payload: { source: string; fieldValue: string }): Promise<void> {
      this.displayName = payload.source;
      this.autoTranslatedFields = ['display_name'];
      if (this.record) {
        this.record.display_name = payload.fieldValue;
        this.record.display_name_source = payload.source;
        this.record.auto_translated_fields = ['display_name'];
      }
      ElMessage.success(this.$t('site.capabilityOverride.saved') as string);
      this.$emit('saved');
    },
    async onTranslationDisabled(payload: { fieldValue: string | null }): Promise<void> {
      this.displayName = payload.fieldValue ?? '';
      this.autoTranslatedFields = [];
      if (this.record) {
        this.record.display_name = payload.fieldValue;
        this.record.display_name_source = payload.fieldValue;
        this.record.auto_translated_fields = [];
      }
      ElMessage.success(this.$t('site.capabilityOverride.saved') as string);
      this.$emit('saved');
    }
  }
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.section-title {
  margin: 6px 0 16px;
  font-size: 16px;
}

.field-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.icon-comparison {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  flex-wrap: wrap;
}

.icon-preview-block {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.preview-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  object-fit: cover;
  background: var(--el-fill-color-lighter);
}

.icon-actions {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  width: 100%;
}

.footer-spacer {
  flex: 1;
}

.model-names-tip {
  margin: -10px 0 12px;
}

.model-visibility-tip {
  margin: -6px 0 12px;
}

.model-name-list {
  display: grid;
  gap: 12px;
}

.model-name-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1.2fr);
  align-items: center;
  gap: 14px;
}

.model-name-default {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.model-name-default img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.model-name-default div {
  display: grid;
  min-width: 0;
}

.model-name-default strong,
.model-name-default small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-name-default small {
  color: var(--el-text-color-secondary);
}

.model-customization {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.model-icon-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.model-icon-actions .el-button + .el-button {
  margin-left: 0;
}

.model-icon-preview {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.model-visibility {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

@media (max-width: 479px) {
  .model-name-row {
    grid-template-columns: 1fr;
  }
  .icon-comparison {
    gap: 14px;
  }

  .icon-actions {
    flex-basis: 100%;
  }
}
</style>
