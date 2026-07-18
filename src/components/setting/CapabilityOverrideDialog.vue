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
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox } from 'element-plus';
import { UploadIcon } from '@acedatacloud/core/icons/components';
import AutoTranslateToggle from '@/components/site/AutoTranslateToggle.vue';
import ImageCropper from '@/components/common/ImageCropper.vue';
import { siteCapabilityOverrideOperator } from '@/operators';
import type { ISiteCapabilityOverride } from '@/models';
import type { CapabilityKey } from '@/constants/capabilities';

export default defineComponent({
  name: 'CapabilityOverrideDialog',
  components: {
    AutoTranslateToggle,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ImageCropper,
    UploadIcon
  },
  props: {
    modelValue: { type: Boolean, default: false },
    siteId: { type: String, required: true },
    capability: { type: String as PropType<CapabilityKey>, required: true },
    defaultName: { type: String, required: true },
    defaultIcon: { type: String, required: true },
    override: { type: Object as PropType<ISiteCapabilityOverride | null>, default: null }
  },
  emits: ['update:modelValue', 'saved'],
  data() {
    return {
      record: null as ISiteCapabilityOverride | null,
      displayName: '',
      iconUrl: '',
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
      this.autoTranslatedFields = [...(this.override?.auto_translated_fields ?? [])];
      this.iconEditorVisible = false;
    },
    extractError(error: unknown): string {
      const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (!data) return '';
      const detail = data.detail;
      if (typeof detail === 'string') return detail;
      return Object.values(data)
        .flat()
        .filter((value) => typeof value === 'string')
        .join(' ');
    },
    async onSave(): Promise<void> {
      const displayName = this.displayName.trim() || null;
      const iconUrl = this.iconUrl.trim() || null;
      if (!displayName && !iconUrl) {
        if (this.record?.id) {
          await this.onReset();
        } else {
          ElMessage.warning(this.$t('site.capabilityOverride.empty') as string);
        }
        return;
      }

      this.submitting = true;
      try {
        if (this.record?.id) {
          const { data } = await siteCapabilityOverrideOperator.update(this.record.id, {
            display_name: displayName,
            icon_url: iconUrl
          });
          this.record = data;
          ElMessage.success(this.$t('site.capabilityOverride.saved') as string);
          this.$emit('saved');
          this.visible = false;
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
          ElMessage.success(this.$t('site.capabilityOverride.savedEnableTranslation') as string);
          this.$emit('saved');
        }
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
