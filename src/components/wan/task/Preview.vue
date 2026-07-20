<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="wan" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="wan" part="name" />
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('wan.status.pending') }}) </span>
          <span v-if="modelValue?.response && isWaiting"> - ({{ $t('wan.status.processing') }}) </span>
        </p>
      </div>
      <!-- Display success message -->
      <div
        v-if="modelValue?.response?.success === true && !isFailure && !isWaiting"
        :class="{ content: true, failed: true }"
      >
        <div v-if="modelValue?.response?.video_url" class="mb-4">
          <video-player :src="modelValue?.response?.video_url" />
        </div>
        <div v-if="modelValue?.response?.video_url" :class="{ operations: true, 'mt-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('wan.message.downloadVideo')" placement="top-start">
            <el-button type="info" size="small" class="mb-2" @click.stop="onDownload(modelValue?.response?.video_url)">
              {{ $t('wan.button.download') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/wan/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.model') }}:
            {{ modelValue?.request?.model }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="isFailure" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="isWaiting" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t(modelValue?.response ? 'wan.status.processing' : 'wan.status.pending') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('wan.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ChannelIcon, InfoIcon, MagicIcon, TimeIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElTooltip } from 'element-plus';
import { IWanTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ChannelIcon,
    InfoIcon,
    MagicIcon,
    TimeIcon,
    WarningIcon,
    CopyToClipboard,
    ElAlert,
    VideoPlayer,
    ElTooltip,
    ElButton,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IWanTask | undefined,
      required: true
    }
  },
  computed: {
    isFailure(): boolean {
      const response = this.modelValue?.response;
      return (
        response?.success === false ||
        !!response?.error ||
        response?.state === 'failed' ||
        response?.state === 'cancelled'
      );
    },
    isWaiting(): boolean {
      const response = this.modelValue?.response;
      if (!response) return true;
      if (this.isFailure) return false;
      if (['queued', 'pending', 'processing', 'running'].includes(response.state || '')) return true;
      return response.success !== true && !response.state;
    },
    application() {
      return this.$store.state.wan?.application;
    },
    config() {
      return this.$store.state.wan?.config;
    }
  },
  methods: {
    onDownload(videoUrl: string) {
      console.debug('on download wan video', videoUrl);
      window.open(videoUrl, '_blank');
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
  margin-bottom: 15px;
  .left {
    width: $left-width;
    .avatar {
      width: 50px;
      height: 50px;
      margin: 10px;
      border-radius: 50%;
      box-shadow: var(--app-shadow-xs);
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
        margin-bottom: 10px;
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
  }
}
</style>
