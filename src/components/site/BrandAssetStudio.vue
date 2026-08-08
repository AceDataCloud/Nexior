<template>
  <span
    class="edit"
    role="button"
    tabindex="0"
    :aria-label="$t('common.button.edit')"
    :title="$t('common.button.edit')"
    @click="editing = true"
    @keydown.enter.prevent="editing = true"
    @keydown.space.prevent="editing = true"
  >
    <el-icon><edit-icon :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
  </span>

  <el-dialog
    v-model="editing"
    :title="title"
    width="min(880px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    append-to-body
    @closed="reset"
  >
    <template v-if="step === 'crop'">
      <div v-if="imageSrc" class="cropper-shell">
        <Cropper
          ref="cropperRef"
          class="cropper"
          :src="imageSrc"
          :stencil-props="{ aspectRatio }"
          :stencil-component="rectangleStencil"
          :default-size="defaultSizePercent"
          :resize-image="{ adjustStencil: false }"
          image-restriction="fit-area"
        />
        <el-button-group class="toolbar">
          <el-tooltip :content="$t('site.imageCropper.zoomIn')">
            <el-button :aria-label="$t('site.imageCropper.zoomIn')" @click="onZoom(1.25)">
              <zoom-in-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('site.imageCropper.zoomOut')">
            <el-button :aria-label="$t('site.imageCropper.zoomOut')" @click="onZoom(0.8)">
              <zoom-out-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('site.imageCropper.rotateLeft')">
            <el-button :aria-label="$t('site.imageCropper.rotateLeft')" @click="onRotate(-90)">
              <undo-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('site.imageCropper.rotateRight')">
            <el-button :aria-label="$t('site.imageCropper.rotateRight')" @click="onRotate(90)">
              <redo-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('site.imageCropper.flipHorizontal')">
            <el-button :aria-label="$t('site.imageCropper.flipHorizontal')" @click="onFlip">
              <sort-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('site.imageCropper.replace')">
            <el-button :aria-label="$t('site.imageCropper.replace')" @click="openPicker">
              <image-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </el-tooltip>
        </el-button-group>
      </div>
      <div v-else class="dropzone" @click="openPicker" @drop.prevent="onDrop" @dragover.prevent>
        <upload-icon class="dropzone-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
        <p>{{ $t('site.imageCropper.dropHere') }}</p>
        <span>{{ tip }}</span>
      </div>
    </template>

    <div v-else class="studio">
      <div class="analysis-row">
        <div>
          <strong>{{ $t('site.logoStudio.analysisReady') }}</strong>
          <span>{{ analysisSummary }}</span>
        </div>
        <el-tag :type="analysis?.background.removable ? 'success' : 'info'" effect="light">
          {{
            analysis?.background.removable
              ? $t('site.logoStudio.backgroundDetected')
              : $t('site.logoStudio.transparentOrComplex')
          }}
        </el-tag>
      </div>

      <div class="controls">
        <div class="control-row">
          <span>{{ $t('site.logoStudio.removeBackground') }}</span>
          <el-switch v-model="removeBackground" />
        </div>
        <div v-if="removeBackground" class="control-grid">
          <label>
            <span>{{ $t('site.logoStudio.backgroundColor') }}</span>
            <el-color-picker v-model="backgroundColor" :predefine="['#ffffff', '#000000']" />
          </label>
          <label class="tolerance-control">
            <span>{{ $t('site.logoStudio.edgeTolerance') }}</span>
            <el-slider v-model="tolerance" :min="20" :max="96" :step="1" />
          </label>
          <el-button :loading="processing" :disabled="!controlsDirty" @click="processCurrent">
            <refresh-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('site.logoStudio.refreshPreview') }}
          </el-button>
        </div>
      </div>

      <el-radio-group v-if="kind === 'logo'" v-model="appearance" class="appearance-picker">
        <el-radio-button value="brand">{{ $t('site.logoStudio.modeBrand') }}</el-radio-button>
        <el-radio-button value="balanced">{{ $t('site.logoStudio.modeBalanced') }}</el-radio-button>
        <el-radio-button value="mono">{{ $t('site.logoStudio.modeMono') }}</el-radio-button>
      </el-radio-group>

      <div class="theme-previews">
        <div class="theme-preview theme-preview--light">
          <span>{{ $t('site.logoStudio.lightTheme') }}</span>
          <img v-if="selectedUrls" :src="selectedUrls.light" alt="" />
        </div>
        <div class="theme-preview theme-preview--dark">
          <span>{{ $t('site.logoStudio.darkTheme') }}</span>
          <img v-if="selectedUrls" :src="selectedUrls.dark" alt="" />
        </div>
      </div>

      <el-alert v-if="controlsDirty" type="warning" :closable="false" show-icon>
        {{ $t('site.logoStudio.previewOutdated') }}
      </el-alert>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onPick" />
    <template #footer>
      <el-button @click="editing = false">{{ $t('common.button.cancel') }}</el-button>
      <el-button v-if="step === 'preview'" @click="step = 'crop'">{{ $t('site.logoStudio.back') }}</el-button>
      <el-button
        type="primary"
        :loading="busy"
        :disabled="step === 'crop' ? !imageSrc : !assets || controlsDirty"
        @click="step === 'crop' ? analyzeAndProcess() : confirm()"
      >
        {{ step === 'crop' ? $t('site.logoStudio.analyze') : $t('site.logoStudio.apply') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import {
  EditIcon,
  ImageIcon,
  RedoIcon,
  RefreshIcon,
  SortIcon,
  UndoIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent, type PropType } from 'vue';
import {
  ElAlert,
  ElButton,
  ElButtonGroup,
  ElColorPicker,
  ElDialog,
  ElIcon,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElSlider,
  ElSwitch,
  ElTag,
  ElTooltip
} from 'element-plus';
import { Cropper, RectangleStencil } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

import { httpClient } from '@/operators/common';
import {
  defaultBrandAssetAppearance,
  selectBrandAssetUrls,
  type BrandAssetAppearance,
  type BrandAssetKind
} from '@/utils/brandAsset';

interface AssetAnalysis {
  width: number;
  height: number;
  format: string;
  has_transparency: boolean;
  background: { color: string | null; confidence: number; removable: boolean };
}

interface ProcessedAsset {
  url: string;
  file_id: string;
  width: number;
  height: number;
}

interface ProcessedAssets {
  color: ProcessedAsset;
  light: ProcessedAsset;
  dark: ProcessedAsset;
  adaptive_dark?: ProcessedAsset;
}

export interface BrandAssetStudioResult {
  color: string;
  light: string;
  dark: string;
}

export default defineComponent({
  name: 'BrandAssetStudio',
  components: {
    Cropper,
    EditIcon,
    ElAlert,
    ElButton,
    ElButtonGroup,
    ElColorPicker,
    ElDialog,
    ElIcon,
    ElRadioButton,
    ElRadioGroup,
    ElSlider,
    ElSwitch,
    ElTag,
    ElTooltip,
    ImageIcon,
    RedoIcon,
    RefreshIcon,
    SortIcon,
    UndoIcon,
    UploadIcon,
    ZoomInIcon,
    ZoomOutIcon
  },
  props: {
    kind: { type: String as PropType<BrandAssetKind>, default: 'logo' },
    title: { type: String, required: true },
    tip: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  emits: ['confirm'],
  data() {
    return {
      rectangleStencil: RectangleStencil,
      editing: false,
      step: 'crop' as 'crop' | 'preview',
      imageSrc: '',
      sourceBlob: null as Blob | null,
      analysis: null as AssetAnalysis | null,
      assets: null as ProcessedAssets | null,
      removeBackground: false,
      backgroundColor: '#ffffff',
      tolerance: 42,
      appearance: defaultBrandAssetAppearance(this.kind),
      analyzing: false,
      processing: false,
      processedSignature: ''
    };
  },
  computed: {
    aspectRatio(): number {
      return this.width / this.height;
    },
    busy(): boolean {
      return this.analyzing || this.processing;
    },
    controlsSignature(): string {
      return `${this.removeBackground}:${this.backgroundColor.toLowerCase()}:${this.tolerance}`;
    },
    controlsDirty(): boolean {
      return !!this.assets && this.processedSignature !== this.controlsSignature;
    },
    selectedUrls(): { light: string; dark: string } | null {
      if (!this.assets) return null;
      return selectBrandAssetUrls(this.kind, this.appearance as BrandAssetAppearance, {
        color: this.assets.color.url,
        light: this.assets.light.url,
        dark: this.assets.dark.url,
        adaptiveDark: this.assets.adaptive_dark?.url
      });
    },
    analysisSummary(): string {
      if (!this.analysis) return '';
      return this.$t('site.logoStudio.analysisSummary', {
        width: this.analysis.width,
        height: this.analysis.height,
        confidence: Math.round(this.analysis.background.confidence * 100)
      }) as string;
    },
    defaultSizePercent() {
      return ({ imageSize }: { imageSize: { width: number; height: number } }) => {
        const width = imageSize.width * 0.9;
        const height = width / this.aspectRatio;
        if (height <= imageSize.height * 0.9) return { width, height };
        const fittedHeight = imageSize.height * 0.9;
        return { width: fittedHeight * this.aspectRatio, height: fittedHeight };
      };
    }
  },
  methods: {
    openPicker() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },
    onPick(event: Event) {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) this.loadFile(file);
      target.value = '';
    },
    onDrop(event: DragEvent) {
      const file = event.dataTransfer?.files?.[0];
      if (file) this.loadFile(file);
    },
    loadFile(file: File) {
      if (!file.type.startsWith('image/')) {
        ElMessage.error(this.$t('site.imageCropper.invalidType') as string);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        this.imageSrc = (event.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    },
    onZoom(factor: number) {
      (this.$refs.cropperRef as { zoom?: (value: number) => void } | undefined)?.zoom?.(factor);
    },
    onRotate(angle: number) {
      (this.$refs.cropperRef as { rotate?: (value: number) => void } | undefined)?.rotate?.(angle);
    },
    onFlip() {
      (this.$refs.cropperRef as { flip?: (horizontal: boolean, vertical: boolean) => void } | undefined)?.flip?.(
        true,
        false
      );
    },
    async croppedBlob(): Promise<Blob> {
      const result = (
        this.$refs.cropperRef as { getResult?: () => { canvas: HTMLCanvasElement | null } } | undefined
      )?.getResult?.();
      if (!result?.canvas) throw new Error(this.$t('site.imageCropper.noImage') as string);
      const output = document.createElement('canvas');
      const scale = Math.max(3, Math.ceil(512 / Math.max(this.width, this.height)));
      output.width = this.width * scale;
      output.height = this.height * scale;
      const context = output.getContext('2d');
      if (!context) throw new Error(this.$t('site.imageCropper.canvasError') as string);
      context.drawImage(result.canvas, 0, 0, output.width, output.height);
      return await new Promise((resolve, reject) => {
        output.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error(this.$t('site.imageCropper.canvasError') as string))),
          'image/png'
        );
      });
    },
    async analyzeAndProcess() {
      this.analyzing = true;
      try {
        this.sourceBlob = await this.croppedBlob();
        const formData = new FormData();
        formData.append('file', this.sourceBlob, `${this.kind}.png`);
        const { data } = await httpClient.post<{ analysis: AssetAnalysis }>('/logo-assets/analyze/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        });
        this.analysis = data.analysis;
        this.removeBackground = data.analysis.background.removable;
        this.backgroundColor = data.analysis.background.color || '#ffffff';
        this.appearance = defaultBrandAssetAppearance(this.kind);
        if (await this.processCurrent()) this.step = 'preview';
      } catch (error) {
        this.showError(error);
      } finally {
        this.analyzing = false;
      }
    },
    async processCurrent(): Promise<boolean> {
      if (!this.sourceBlob) return false;
      this.processing = true;
      try {
        const formData = new FormData();
        formData.append('file', this.sourceBlob, `${this.kind}.png`);
        formData.append('remove_background', String(this.removeBackground));
        formData.append('background_color', this.backgroundColor);
        formData.append('tolerance', String(this.tolerance));
        const { data } = await httpClient.post<{ assets: ProcessedAssets }>('/logo-assets/process/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        });
        this.assets = data.assets;
        this.processedSignature = this.controlsSignature;
        return true;
      } catch (error) {
        this.showError(error);
        return false;
      } finally {
        this.processing = false;
      }
    },
    confirm() {
      if (!this.assets || !this.selectedUrls || this.controlsDirty) return;
      this.$emit('confirm', {
        color: this.assets.color.url,
        light: this.selectedUrls.light,
        dark: this.selectedUrls.dark
      } satisfies BrandAssetStudioResult);
      this.editing = false;
    },
    showError(error: unknown) {
      const response = (error as { response?: { data?: { error?: string; detail?: string } }; message?: string })
        ?.response;
      ElMessage.error(
        response?.data?.error ||
          response?.data?.detail ||
          (error as { message?: string })?.message ||
          (this.$t('site.imageCropper.uploadFailed') as string)
      );
    },
    reset() {
      this.step = 'crop';
      this.imageSrc = '';
      this.sourceBlob = null;
      this.analysis = null;
      this.assets = null;
      this.removeBackground = false;
      this.backgroundColor = '#ffffff';
      this.tolerance = 42;
      this.appearance = defaultBrandAssetAppearance(this.kind);
      this.analyzing = false;
      this.processing = false;
      this.processedSignature = '';
    }
  }
});
</script>

<style lang="scss" scoped>
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
}

.cropper-shell,
.studio,
.controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cropper {
  width: 100%;
  height: 380px;
  background: #151719;
  border-radius: 6px;
  overflow: hidden;
}

.toolbar,
.appearance-picker {
  align-self: center;
}

.dropzone {
  height: 380px;
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  background: var(--el-fill-color-lighter);

  p {
    margin: 0;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.dropzone-icon {
  color: var(--el-text-color-secondary);
  font-size: 38px;
}

.analysis-row,
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.analysis-row {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.control-grid {
  display: grid;
  grid-template-columns: 140px minmax(220px, 1fr) auto;
  align-items: end;
  gap: 20px;

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.tolerance-control :deep(.el-slider) {
  margin: 0 10px;
  width: calc(100% - 20px);
}

.theme-previews {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.theme-preview {
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;

  > span {
    position: absolute;
    top: 10px;
    left: 12px;
    font-size: 12px;
  }

  img {
    width: min(78%, 300px);
    height: 90px;
    object-fit: contain;
  }
}

.theme-preview--light {
  background: #f4f5f7;
  color: #525866;
}

.theme-preview--dark {
  background: #111315;
  color: #c9cdd4;
}

@media (max-width: 680px) {
  .control-grid,
  .theme-previews {
    grid-template-columns: 1fr;
  }

  .cropper {
    height: 300px;
  }

  .theme-preview {
    height: 140px;
  }
}
</style>
