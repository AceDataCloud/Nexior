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
import { ElButton, ElDialog, ElDivider, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox } from 'element-plus';
import { UploadIcon } from '@acedatacloud/core/icons/components';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import ImageCropper from '@/components/common/ImageCropper.vue';
import { siteCapabilityOverrideOperator } from '@/operators';
import type { ISite, ISiteAssistantSkillBinding, ISiteCapabilityOverride } from '@/models';
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
    site: { type: Object as PropType<ISite>, default: () => ({ features: {} }) }
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      record: null as ISiteCapabilityOverride | null,
      displayName: '',
      iconUrl: '',
      instructions: '',
      skills: [] as ISiteAssistantSkillBinding[],
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
      this.autoTranslatedFields = [...(this.override?.auto_translated_fields ?? [])];
      this.iconEditorVisible = false;
    },
    extractError(error: unknown): string {
      return extractApiErrorMessage(error);
    },
    async saveAssistant(): Promise<void> {
      if (!this.supportsAssistant || !this.site.id) return;
      const feature = this.site.features?.[this.capability] || {};
      await siteOperator.update(
        this.site.id,
        {
          features: {
            ...(this.site.features || {}),
            [this.capability]: {
              ...feature,
              assistant: { instructions: this.instructions.trim(), skills: this.skills }
            }
          }
        },
        this.site.configuration_revision
      );
    },
    async onSave(): Promise<void> {
      const displayName = this.displayName.trim() || null;
      const iconUrl = this.iconUrl.trim() || null;
      this.submitting = true;
      try {
        let createdAppearance = false;
        if (this.supportsAssistant) await this.saveAssistant();
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
        this.$emit('saved');
        if (!createdAppearance) this.visible = false;
      } catch (error) {
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

@media (max-width: 479px) {
  .icon-comparison {
    gap: 14px;
  }

  .icon-actions {
    flex-basis: 100%;
  }
}
</style>
