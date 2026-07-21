<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="nanobanana" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="nanobanana" part="name" />
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <div
          v-if="modelValue?.request?.image_urls && modelValue?.request?.image_urls.length > 0"
          class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto"
        >
          <image-preview
            v-for="(url, idx) in modelValue?.request?.image_urls"
            :key="idx"
            :url="url"
            :name="`image-${idx + 1}`"
            :closable="false"
          />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('nanobanana.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="showResult" :class="{ content: true, failed: true }">
        <div class="flex justify-start items-center gap-4 w-full overflow-x-auto">
          <image-wrapper
            v-for="(image, imageIndex) in images"
            :key="imageIndex"
            :src="image?.image_url!"
            :raw-src="image?.image_url!"
          />
        </div>
        <div :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('common.button.edit')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onEdit(images?.[0]?.image_url)">
              {{ $t('common.button.edit') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/nano-banana/images" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="modelValue?.request?.resolution" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.resolution') }}:
            {{ modelValue?.request?.resolution }}
          </p>
          <p v-if="modelValue?.request?.aspect_ratio" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <external-link-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.aspectRatio') }}:
            {{ modelValue?.request?.aspect_ratio }}
          </p>
          <p v-if="modelValue?.request?.action" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.task') }}:
            {{
              modelValue?.request?.action === 'generate' ? $t('nanobanana.name.generate') : $t('nanobanana.name.edits')
            }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div
        v-else-if="modelValue?.response?.success === false || modelValue?.response?.error"
        :class="{ content: true }"
      >
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.failure') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="modelValue?.request?.resolution" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.resolution') }}:
            {{ modelValue?.request?.resolution }}
          </p>
          <p v-if="modelValue?.request?.aspect_ratio" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <external-link-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.aspectRatio') }}:
            {{ modelValue?.request?.aspect_ratio }}
          </p>
          <p v-if="modelValue?.request?.action" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.task') }}:
            {{
              modelValue?.request?.action === 'generate' ? $t('nanobanana.name.generate') : $t('nanobanana.name.edits')
            }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-else :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.status.pending') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="modelValue?.request?.resolution" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <image-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.resolution') }}:
            {{ modelValue?.request?.resolution }}
          </p>
          <p v-if="modelValue?.request?.aspect_ratio" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <external-link-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.aspectRatio') }}:
            {{ modelValue?.request?.aspect_ratio }}
          </p>
          <p v-if="modelValue?.request?.action" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <lightning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.task') }}:
            {{
              modelValue?.request?.action === 'generate' ? $t('nanobanana.name.generate') : $t('nanobanana.name.edits')
            }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('nanobanana.name.taskId') }}:
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
  ExternalLinkIcon,
  ImageIcon,
  InfoIcon,
  LightningIcon,
  MagicIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElTooltip } from 'element-plus';
import { INanobananaTask, INanobananaImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ApplicationIcon,
    ChannelIcon,
    ExternalLinkIcon,
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
      type: Object as () => INanobananaTask | undefined,
      required: true
    }
  },
  computed: {
    images(): INanobananaImage[] {
      const result: INanobananaImage[] = [];
      // @ts-ignore
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          result.push(item as INanobananaImage);
        });
      }
      return result;
    },
    // Show the result view when the task explicitly succeeded, OR when image
    // data is present and it is not an explicit failure. A router failover write
    // can drop the `success` flag while still storing a valid image, so keying
    // render off the actual data (not only the boolean) stops a valid result
    // from being hidden as a "failure". Explicit `success === false` always wins.
    hasImages(): boolean {
      return this.images.some((image) => !!image?.image_url);
    },
    showResult(): boolean {
      const response = this.modelValue?.response;
      if (!response) return false;
      if (response.success === true) return true;
      return this.hasImages && response.success !== false;
    }
  },
  methods: {
    onEdit(imageUrl?: string) {
      if (!imageUrl) return;
      console.debug('Edit image:', imageUrl);
      // Preload image into uploader list for editing
      const nextConfig = { ...(this.$store.state.nanobanana?.config || {}) };
      delete (nextConfig as any).action;
      (nextConfig as any).image_urls = [imageUrl];
      this.$store.commit('nanobanana/setConfig', nextConfig);
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
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
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
}
</style>
