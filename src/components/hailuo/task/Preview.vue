<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="hailuo" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="hailuo" part="name" />
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('hailuo.status.pending') }}) </span>
          <span v-if="modelValue?.response && isWaiting"> - ({{ $t('hailuo.status.processing') }}) </span>
        </p>
      </div>
      <!-- Display success message -->
      <div
        v-if="modelValue?.response?.success === true && !isFailure && !isWaiting"
        :class="{ content: true, failed: true }"
      >
        <div v-if="video?.video_url" class="mb-4">
          <video-player :src="video?.video_url" />
        </div>
        <div v-if="video" :class="{ operations: true, 'mt-2': true }">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="$t('hailuo.message.downloadVideo')"
            placement="top-start"
          >
            <el-button
              v-if="video?.video_url"
              type="info"
              size="small"
              class="mb-2"
              @click.stop="onDownload(video?.video_url)"
            >
              {{ $t('hailuo.button.download') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/hailuo/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.model') }}:
            {{ modelValue?.request?.model }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="isFailure" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- Display waiting message -->
      <div v-if="isWaiting" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t(modelValue?.response ? 'hailuo.status.processing' : 'hailuo.status.pending') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('hailuo.name.taskId') }}:
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
import { IHailuoTask, IHailuoVideo } from '@/models';
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
      type: Object as () => IHailuoTask | undefined,
      required: true
    }
  },
  computed: {
    isFailure(): boolean {
      const response = this.modelValue?.response;
      return (
        response?.success === false ||
        !!response?.error ||
        this.video?.state === 'failed' ||
        this.video?.state === 'cancelled'
      );
    },
    isWaiting(): boolean {
      const response = this.modelValue?.response;
      return (
        !response ||
        (!this.isFailure && ['queued', 'pending', 'processing', 'running'].includes(this.video?.state || ''))
      );
    },
    application() {
      return this.$store.state.hailuo?.application;
    },
    config() {
      return this.$store.state.hailuo?.config;
    },
    video(): IHailuoVideo | undefined {
      return this.modelValue?.response?.data?.[0];
    }
  },
  methods: {
    onDownload(videoUrl: string) {
      console.debug('on download hailuo video', videoUrl);
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
