<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="seedream" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="seedream" part="name" />
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
        <el-tooltip effect="dark" :content="$t('common.button.delete')" placement="top">
          <button
            v-if="modelValue?.id"
            type="button"
            class="btn-delete"
            :aria-label="$t('common.button.delete')"
            @click.stop="onDelete"
          >
            <delete-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </el-tooltip>
      </div>
      <div class="info">
        <div v-if="requestImages.length > 0" class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto">
          <image-preview
            v-for="(url, idx) in requestImages"
            :key="idx"
            :url="url"
            :name="`image-${idx + 1}`"
            :closable="false"
          />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('seedream.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.status.pending') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div class="layer-grid">
          <article v-for="(image, imageIndex) in images" :key="imageIndex" class="layer-card">
            <image-wrapper v-if="image?.image_url" :src="image.image_url" :raw-src="image.image_url" />
            <div v-if="isLayerResult || image.error" class="layer-meta">
              <strong>{{ layerTitle(image, imageIndex) }}</strong>
              <span v-if="image.size">{{ image.size }} · {{ image.output_format?.toUpperCase() }}</span>
              <span v-if="image.description">{{ image.description }}</span>
              <code v-if="image.bounding_box?.absolute">{{ image.bounding_box.absolute.join(', ') }}</code>
              <span v-if="image.error" class="layer-error">{{ image.error.message || image.error.code }}</span>
            </div>
          </article>
        </div>
        <div :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('common.button.edit')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onEdit(images?.[0]?.image_url)">
              {{ $t('common.button.edit') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/seedream/images" :body="apiRequest" />
          <report-button
            service="seedream"
            :target-id="modelValue?.id"
            :snapshot="{ prompt: modelValue?.request?.prompt }"
          />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.model') }}:
            {{ shortModel(modelValue?.request?.model) }}
          </p>
          <p v-if="modelValue?.request?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.size') }}:
            {{ modelValue?.request?.size }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.task') }}:
            {{ isEdit ? $t('seedream.name.edits') : $t('seedream.name.generate') }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === false" class="content">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.failure') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.model') }}:
            {{ shortModel(modelValue?.request?.model) }}
          </p>
          <p v-if="modelValue?.request?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.size') }}:
            {{ modelValue?.request?.size }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.task') }}:
            {{ isEdit ? $t('seedream.name.edits') : $t('seedream.name.generate') }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.response?.error?.message" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-else :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.status') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedream.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ApplicationIcon,
  ChannelIcon,
  DeleteIcon,
  ImageIcon,
  InfoIcon,
  LightningIcon,
  MagicIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElTooltip, ElMessageBox, ElMessage } from 'element-plus';
import { ISeedreamTask, ISeedreamImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import ReportButton from '@/components/common/ReportButton.vue';
import { getSeedreamShortModel } from '@/constants';
import { buildSeedreamRequest } from '@/utils/seedream/request';

export default defineComponent({
  name: 'SeedreamTaskPreview',
  components: {
    DeleteIcon,
    ApplicationIcon,
    ChannelIcon,
    ImageIcon,
    InfoIcon,
    LightningIcon,
    MagicIcon,
    TimeIcon,
    WarningIcon,
    CopyToClipboard,
    ElAlert,
    ImageWrapper,
    ElButton,
    ElTooltip,
    ImagePreview,
    ApiCodeButton,
    ReportButton
  },
  props: {
    modelValue: {
      type: Object as () => ISeedreamTask | undefined,
      required: true
    }
  },
  computed: {
    apiRequest() {
      return buildSeedreamRequest(this.modelValue?.request);
    },
    requestImages(): string[] {
      const image = this.modelValue?.request?.image;
      if (typeof image === 'string') return [image];
      return Array.isArray(image) ? image : [];
    },
    isEdit(): boolean {
      return Array.isArray(this.modelValue?.request?.image) && (this.modelValue?.request?.image?.length || 0) > 0;
    },
    images(): ISeedreamImage[] {
      const data = this.modelValue?.response?.data;
      if (!Array.isArray(data)) return [];
      return [...data].sort(
        (left, right) => (left.z_index ?? Number.MAX_SAFE_INTEGER) - (right.z_index ?? Number.MAX_SAFE_INTEGER)
      );
    },
    isLayerResult(): boolean {
      return (
        this.modelValue?.request?.layer_decomposition === true ||
        this.images.some((image) => image.z_index !== undefined)
      );
    }
  },
  methods: {
    async onDelete() {
      const id = this.modelValue?.id;
      if (!id) return;
      try {
        await ElMessageBox.confirm(this.$t('common.message.deleteTaskConfirm'), this.$t('common.button.delete'), {
          type: 'warning',
          confirmButtonText: this.$t('common.button.delete'),
          cancelButtonText: this.$t('common.button.cancel'),
          confirmButtonClass: 'el-button--danger'
        });
      } catch {
        return; // user cancelled
      }
      try {
        await this.$store.dispatch('seedream/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
    },
    shortModel(model?: string) {
      return getSeedreamShortModel(model) || model;
    },
    layerTitle(image: ISeedreamImage, index: number): string {
      if (image.error) return this.$t('seedream.name.failedLayer', { index: index + 1 });
      if (image.z_index === 0) return this.$t('seedream.name.baseLayer');
      return image.name || this.$t('seedream.name.layer', { index: image.z_index ?? index + 1 });
    },
    onEdit(imageUrl?: string) {
      if (!imageUrl) return;
      console.debug('Edit image:', imageUrl);
      const nextConfig = { ...(this.$store.state.seedream?.config || {}) };
      (nextConfig as any).image = [imageUrl];
      this.$store.commit('seedream/setConfig', nextConfig);
    }
  }
});
</script>

<style lang="scss" scoped>
$left-width: 70px;
.preview {
  width: 100%;
  height: fit-content;
  text-align: left;
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  .left {
    width: $left-width;
    .avatar {
      width: 50px;
      height: 50px;
      margin: 10px;
      border-radius: 50%;
    }
  }

  .main {
    flex: 1;
    width: calc(100% - $left-width);
    min-width: 0;
    padding: 10px 10px 0 10px;

    .bot {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      color: var(--el-color-primary);
      margin-bottom: 0;
      margin-top: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .datetime {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
      .btn-delete {
        margin-left: auto;
        padding: 4px 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        line-height: 1;
        color: var(--el-text-color-secondary);
        // Hover-reveal on pointer devices; keep it out of the way until wanted.
        opacity: 0;
        transition:
          opacity 0.15s ease,
          color 0.15s ease;
        &:hover {
          color: var(--el-color-danger);
        }
        // Touch devices have no hover — always show the control.
        @media (hover: none) {
          opacity: 1;
        }
      }
    }

    .info {
      overflow: hidden;
      .prompt {
        font-size: 16px;
        font-weight: bold;
        color: var(--el-text-color-regular);
        margin-bottom: 0;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
    }

    .content {
      margin-top: 8px;
      word-break: break-word;
      overflow-wrap: anywhere;
      .el-alert {
        border-left-width: 2px;
        border-left-style: solid;
        &.failure {
          border-color: var(--el-color-danger);
        }
        &.success {
          border-color: var(--el-color-success);
        }
        &.info {
          border-color: var(--el-color-info);
        }
        // Drop the trailing `mb-2` on whichever `<p>` ends up rendered
        // last (trace_id / elapsed are conditional — e.g. pending tasks).
        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }

    .layer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
      gap: 12px;
      width: 100%;
    }
    .layer-card {
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
      background: var(--el-bg-color);
    }
    .layer-meta {
      display: grid;
      gap: 4px;
      padding: 10px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      code {
        overflow-x: auto;
        white-space: nowrap;
      }
    }
    .layer-error {
      color: var(--el-color-danger);
    }
    .operations {
      display: flex;
      justify-content: left;
      flex-direction: row;
      width: 100%;
      align-items: baseline;
      flex-wrap: wrap;
      overflow: hidden;
      text-align: center;
      color: var(--el-text-color-regular);
      font-size: 14px;
      .btn-action {
        margin-bottom: 10px;
      }
    }
  }

  // Reveal the trash icon when hovering anywhere on the card.
  &:hover .main .bot .btn-delete {
    opacity: 1;
  }
}
</style>
