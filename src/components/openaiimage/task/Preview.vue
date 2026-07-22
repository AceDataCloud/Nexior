<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="openaiimage" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="openaiimage" part="name" />
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
        <div
          v-if="referenceImages.length > 0"
          class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto"
        >
          <image-preview
            v-for="(url, idx) in referenceImages"
            :key="idx"
            :url="url"
            :name="`image-${idx + 1}`"
            :closable="false"
          />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('openaiimage.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div class="flex justify-start items-center gap-4 w-full overflow-x-auto">
          <image-wrapper
            v-for="(image, imageIndex) in images"
            :key="imageIndex"
            :src="image?.image_url || image?.url || ''"
            :raw-src="image?.image_url || image?.url || ''"
          />
        </div>
        <div :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('common.button.edit')" placement="top-start">
            <el-button
              type="info"
              size="small"
              class="btn-action"
              @click.stop="onEdit(images?.[0]?.image_url || images?.[0]?.url)"
            >
              {{ $t('common.button.edit') }}
            </el-button>
          </el-tooltip>
          <api-code-button :path="openaiimagePath" :body="openaiimageCodeBody" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="(modelValue?.request as any)?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.size') }}:
            {{ (modelValue?.request as any)?.size }}
          </p>
          <p v-if="showTaskType" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.task') }}:
            {{ taskTypeLabel }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.failure') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="(modelValue?.request as any)?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.size') }}:
            {{ (modelValue?.request as any)?.size }}
          </p>
          <p v-if="showTaskType" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.task') }}:
            {{ taskTypeLabel }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-else :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon
              v-if="!modelValue?.response"
              class="mr-1"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            <info-icon v-else class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t(modelValue?.response ? 'openaiimage.name.status' : 'openaiimage.status.pending') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="(modelValue?.request as any)?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.size') }}:
            {{ (modelValue?.request as any)?.size }}
          </p>
          <p v-if="showTaskType" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.task') }}:
            {{ taskTypeLabel }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('openaiimage.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
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
import { ElAlert, ElButton, ElMessageBox, ElMessage, ElTooltip } from 'element-plus';
import { IOpenAIImageTask, IOpenAIImageImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ApplicationIcon,
    ChannelIcon,
    DeleteIcon,
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
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IOpenAIImageTask | undefined,
      required: true
    }
  },
  computed: {
    isEditRequest(): boolean {
      const req: any = this.modelValue?.request;
      return this.modelValue?.type === 'images_edits' || req?.action === 'edit' || this.referenceImages.length > 0;
    },
    showTaskType(): boolean {
      return Boolean(this.modelValue?.request?.action || this.modelValue?.type || this.referenceImages.length > 0);
    },
    taskTypeLabel() {
      return this.isEditRequest ? this.$t('openaiimage.name.edits') : this.$t('openaiimage.name.generate');
    },
    openaiimagePath(): string {
      return this.isEditRequest ? '/openai/images/edits' : '/openai/images/generations';
    },
    openaiimageCodeBody(): Record<string, unknown> | undefined {
      const req = this.modelValue?.request as Record<string, unknown> | undefined;
      if (!req) return undefined;
      const body: Record<string, unknown> = { ...req };
      delete body.action;
      delete body.callback_url;
      if (this.isEditRequest) {
        delete body.image_urls;
        delete body.image;
        const images = this.referenceImages;
        if (images.length === 1) {
          body.image = images[0];
        } else if (images.length > 1) {
          body.image = images;
        }
      } else {
        delete body.image_urls;
        delete body.image;
      }
      return body;
    },
    images(): IOpenAIImageImage[] {
      const result: IOpenAIImageImage[] = [];
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          const image = item as IOpenAIImageImage;
          if (image?.image_url || image?.url) {
            result.push(image);
            return;
          }
          if (image?.b64_json) {
            result.push({
              ...image,
              url: `data:image/png;base64,${image.b64_json}`
            });
          }
        });
      }
      return result;
    },
    // Reference images for an edit task. Reads two field shapes:
    //   - `request.image_urls`: string[] — written by the worker after PR
    //     PlatformService#821 (new tasks).
    //   - `request.image`: string | string[] — legacy snapshot shape used by
    //     the worker before #821, which mirrored the multipart `image` form
    //     field 1:1 (singular for one ref, array for multiple). This branch
    //     keeps history rendering correct for tasks already in MongoDB.
    referenceImages(): string[] {
      const req: any = this.modelValue?.request;
      if (!req) return [];
      const fromUrls = Array.isArray(req.image_urls) ? (req.image_urls as string[]) : [];
      if (fromUrls.length > 0) return fromUrls.filter((u) => typeof u === 'string' && u.length > 0);
      const raw = req.image;
      if (Array.isArray(raw)) return raw.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
      if (typeof raw === 'string' && raw.length > 0) return [raw];
      if (Array.isArray(req.images)) {
        return req.images
          .map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') return (item as { image_url?: unknown }).image_url;
            return undefined;
          })
          .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
      }
      return [];
    }
  },
  methods: {
    onEdit(imageUrl?: string) {
      if (!imageUrl) return;
      console.debug('Edit image:', imageUrl);
      const nextConfig = { ...(this.$store.state.openaiimage?.config || {}) };
      (nextConfig as any).image_urls = [imageUrl];
      this.$store.commit('openaiimage/setConfig', nextConfig);
    },
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
        await this.$store.dispatch('openaiimage/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
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
      white-space: nowrap;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
        overflow: hidden;
        text-overflow: ellipsis;
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
        margin-bottom: 15px;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
    }

    .content {
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
