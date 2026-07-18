<template>
  <article class="preview">
    <div class="left">
      <capability-presentation capability="seedream" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="seedream" part="name" />
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <div
          v-if="Array.isArray(modelValue?.request?.image) && modelValue?.request?.image.length > 0"
          class="media-strip mt-2"
        >
          <image-preview
            v-for="(url, idx) in modelValue?.request?.image"
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
        <div class="media-strip result-media">
          <image-wrapper
            v-for="(image, imageIndex) in images"
            :key="imageIndex"
            :src="image?.image_url!"
            :raw-src="image?.image_url!"
          />
        </div>
        <div class="operations">
          <el-tooltip class="box-item" effect="dark" :content="$t('common.button.edit')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onEdit(images?.[0]?.image_url)">
              {{ $t('common.button.edit') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/seedream/images" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="metadata success">
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
      <div v-else-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="metadata failure">
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
        <el-alert :closable="false" class="metadata info">
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
  </article>
</template>

<script lang="ts">
import {
  ApplicationIcon,
  ChannelIcon,
  ImageIcon,
  InfoIcon,
  LightningIcon,
  MagicIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElTooltip } from 'element-plus';
import { ISeedreamTask, ISeedreamImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import { getSeedreamShortModel } from '@/constants';

export default defineComponent({
  name: 'SeedreamTaskPreview',
  components: {
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
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => ISeedreamTask | undefined,
      required: true
    }
  },
  computed: {
    isEdit(): boolean {
      return Array.isArray(this.modelValue?.request?.image) && (this.modelValue?.request?.image?.length || 0) > 0;
    },
    images(): ISeedreamImage[] {
      const result: ISeedreamImage[] = [];
      // @ts-ignore
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          result.push(item as ISeedreamImage);
        });
      }
      return result;
    }
  },
  methods: {
    shortModel(model?: string) {
      return getSeedreamShortModel(model) || model;
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
$left-width: 44px;
.preview {
  width: 100%;
  height: fit-content;
  text-align: left;
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 8px;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-xs);

  .left {
    flex: 0 0 $left-width;
    width: $left-width;

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
    }
  }

  .main {
    flex: 1;
    width: calc(100% - $left-width);
    min-width: 0;

    .bot {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--el-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .datetime {
        flex: 0 0 auto;
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
      }
    }

    .info {
      overflow: hidden;

      .prompt {
        font-size: 14px;
        line-height: 1.6;
        font-weight: 400;
        color: var(--el-text-color-regular);
        margin-bottom: 12px;
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

        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }

    .media-strip {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: thin;

      :deep(.image-wrapper) {
        flex: 0 0 auto;
        margin-bottom: 0;
      }
    }

    .result-media {
      margin-bottom: 10px;
    }

    .operations {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
      color: var(--el-text-color-regular);
      font-size: 14px;

      .btn-action {
        margin: 0;
      }

      :deep(.el-button + .el-button) {
        margin-left: 0;
      }
    }

    .metadata {
      border-radius: 6px;

      :deep(.el-alert__content) {
        min-width: 0;
        width: 100%;
      }
    }
  }
}

@media (max-width: 767px) {
  .preview {
    gap: 10px;
    padding: 12px;

    .left {
      flex-basis: 36px;
      width: 36px;

      .avatar {
        width: 36px;
        height: 36px;
      }
    }

    .main {
      width: calc(100% - 36px);

      .bot {
        align-items: flex-start;
        flex-direction: column;
        gap: 2px;
        white-space: normal;
      }

      .info .prompt {
        font-size: 13px;
      }
    }
  }
}
</style>
