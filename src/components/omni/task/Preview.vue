<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="omni" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="omni" part="name" />
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
        <div v-if="inputImage" class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto">
          <image-preview :url="inputImage" name="image" :closable="false" />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('omni.status.pending') }}) </span>
          <span v-else-if="video?.state === 'processing' || video?.state === 'pending'">
            - ({{ $t('omni.status.processing') }})
          </span>
        </p>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.status.pending') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="pendingElapsed !== undefined" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.elapsed') }}: {{ pendingElapsed }}s
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === true" :class="{ content: true }">
        <div v-if="video?.video_url" class="mb-4">
          <video-player :src="video?.video_url" />
        </div>
        <div v-if="video?.video_url" :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('omni.message.downloadVideo')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onDownload(video?.video_url)">
              {{ $t('omni.button.download') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/gemini/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <application-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="modelValue?.request?.resolution" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <expand-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.resolution') }}:
            {{ modelValue?.request?.resolution }}
            <span v-if="modelValue?.request?.aspect_ratio"> · {{ modelValue?.request?.aspect_ratio }}</span>
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.response?.error?.message" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.status') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('omni.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
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
  ExpandIcon,
  InfoIcon,
  MagicIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElTooltip, ElMessageBox, ElMessage } from 'element-plus';
import { IOmniTask, IOmniVideo } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'OmniTaskPreview',
  components: {
    DeleteIcon,
    ApplicationIcon,
    ChannelIcon,
    CopyToClipboard,
    ExpandIcon,
    InfoIcon,
    MagicIcon,
    TimeIcon,
    WarningIcon,
    ElAlert,
    VideoPlayer,
    ElTooltip,
    ElButton,
    ImagePreview,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IOmniTask | undefined,
      required: true
    }
  },
  data() {
    return {
      nowTs: Date.now(),
      timer: 0
    };
  },
  computed: {
    video(): IOmniVideo | undefined {
      return this.modelValue?.response?.data?.[0];
    },
    inputImage(): string | undefined {
      return this.modelValue?.request?.image_urls?.[0];
    },
    // Live elapsed seconds shown while a task is still pending (no upstream
    // progress %, so elapsed time is the honest signal during the 1-2 min wait).
    pendingElapsed(): number | undefined {
      const created = parseFloat((this.modelValue?.created_at || '').toString());
      if (!created) {
        return undefined;
      }
      return Math.max(0, Math.floor(this.nowTs / 1000 - created));
    }
  },
  watch: {
    'modelValue.response': {
      handler(response) {
        if (response) {
          this.stopTimer();
        }
      }
    }
  },
  mounted() {
    if (!this.modelValue?.response) {
      this.timer = window.setInterval(() => {
        this.nowTs = Date.now();
      }, 1000);
    }
  },
  beforeUnmount() {
    this.stopTimer();
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
        await this.$store.dispatch('omni/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
    },
    stopTimer() {
      if (this.timer) {
        window.clearInterval(this.timer);
        this.timer = 0;
      }
    },
    onDownload(videoUrl: string) {
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
        font-size: 14px;
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
        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }
  }

  // Reveal the trash icon when hovering anywhere on the card.
  &:hover .main .bot .btn-delete {
    opacity: 1;
  }
}
</style>
