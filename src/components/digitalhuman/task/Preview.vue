<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="digitalhuman" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="digitalhuman" part="name" />
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
        <div v-if="faceUrl || audioUrl" class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto">
          <image-preview v-if="faceUrl && isPhotoFace" :url="faceUrl" name="face" :closable="false" />
          <video-preview v-else-if="faceUrl" :url="faceUrl" name="face" />
          <audio-preview v-if="audioUrl" :url="audioUrl" name="audio" />
        </div>
        <p class="prompt mt-2">
          {{ modelValue?.request?.text || voiceLabel }}
          <span v-if="!isTerminal"> - ({{ statusLabel }}) </span>
        </p>
      </div>

      <!-- in-progress: a 40-minute render needs an ETA, not just a bar -->
      <div v-if="!isTerminal" class="content">
        <el-alert :closable="false" class="info-state">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ statusLabel }}
          </p>
          <el-progress :percentage="progressPct" :stroke-width="6" class="mb-2" />
          <p v-if="etaText" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.etaLabel') }}: {{ etaText }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>

      <!-- success: the talking-head video -->
      <div v-if="isSuccess" class="content">
        <video-player v-if="videoUrl" :src="videoUrl" />
        <div class="operations mt-2">
          <el-button v-if="videoUrl" type="info" size="small" class="btn-action" @click="onDownload($event, videoUrl)">
            {{ $t('digitalhuman.button.download') }}
          </el-button>
          <api-code-button path="/digital-human/videos" :body="modelValue?.request" />
          <report-button
            service="digitalhuman"
            :target-id="modelValue?.id"
            :snapshot="{ text: modelValue?.request?.text }"
          />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.response?.duration" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.duration') }}: {{ modelValue?.response?.duration?.toFixed(1) }}s
          </p>
          <p v-if="outputSize" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <fullscreen-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.outputSize') }}: {{ outputSize }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.traceId') }}: {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>

      <!-- failure -->
      <div v-if="isFailure" class="content">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="failureReason" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.failureReason') }}: {{ failureReason }}
            <copy-to-clipboard :content="failureReason" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('digitalhuman.name.traceId') }}: {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ChannelIcon,
  DeleteIcon,
  FullscreenIcon,
  InfoIcon,
  MagicIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElProgress, ElMessageBox, ElMessage, ElTooltip } from 'element-plus';
import { IDigitalHumanTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import ReportButton from '@/components/common/ReportButton.vue';
import AudioPreview from '@/components/common/AudioPreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import VideoPreview from '@/components/common/VideoPreview.vue';
import { DIGITALHUMAN_ETA_SECONDS } from '@/constants';

// A photo now travels in `video_url` like a clip does, so the extension is the
// only thing that still tells the two apart (same test the worker applies).
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ApiCodeButton,
    AudioPreview,
    ChannelIcon,
    CopyToClipboard,
    DeleteIcon,
    ElAlert,
    ElButton,
    ElProgress,
    ElTooltip,
    FullscreenIcon,
    ImagePreview,
    InfoIcon,
    MagicIcon,
    ReportButton,
    TimeIcon,
    VideoPlayer,
    VideoPreview,
    WarningIcon
  },
  props: {
    modelValue: {
      type: Object as () => IDigitalHumanTask | undefined,
      required: true
    }
  },
  computed: {
    status(): string {
      return this.modelValue?.status || this.modelValue?.response?.state || 'pending';
    },
    isSuccess(): boolean {
      return ['succeed', 'succeeded'].includes(this.status) || !!this.modelValue?.response?.video_url;
    },
    isFailure(): boolean {
      return ['failed', 'dead'].includes(this.status) || this.modelValue?.response?.success === false;
    },
    isTerminal(): boolean {
      // drive terminal state off the actual outcome so a finished row never
      // also shows the in-progress bar (robust to succeed/succeeded wording)
      return this.isSuccess || this.isFailure;
    },
    videoUrl(): string | undefined {
      return this.modelValue?.response?.video_url;
    },
    progressPct(): number {
      const p = this.modelValue?.response?.progress;
      return typeof p === 'number' ? p : 0;
    },
    voiceLabel(): string {
      return this.modelValue?.request?.audio_url
        ? (this.$t('digitalhuman.name.audioDriven') as string)
        : (this.$t('digitalhuman.name.textDriven') as string);
    },
    faceUrl(): string | undefined {
      return this.modelValue?.request?.video_url || this.modelValue?.request?.image_url;
    },
    isPhotoFace(): boolean {
      if (this.modelValue?.request?.image_url) return true;
      const path = (this.faceUrl || '').split('?')[0].toLowerCase();
      return IMAGE_EXTS.some((ext) => path.endsWith(ext));
    },
    audioUrl(): string | undefined {
      return this.modelValue?.request?.audio_url;
    },
    outputSize(): string | undefined {
      const { width, height } = this.modelValue?.response || {};
      return width && height ? `${width}×${height}` : undefined;
    },
    /**
     * Rough time remaining. The progress bar alone cannot carry expectations
     * here: it jumps between a handful of fixed checkpoints and then sits
     * still for many minutes.
     */
    etaText(): string | undefined {
      const startedAt = parseFloat((this.modelValue?.created_at || '').toString());
      if (!startedAt) return undefined;
      const remaining = DIGITALHUMAN_ETA_SECONDS - (Date.now() / 1000 - startedAt);
      if (remaining <= 60) {
        return this.$t('digitalhuman.message.etaAlmostDone') as string;
      }
      return this.$t('digitalhuman.message.etaRemaining', { minutes: Math.ceil(remaining / 60) }) as string;
    },
    statusLabel(): string {
      const s = this.status;
      const key = `digitalhuman.status.${s}`;
      const label = this.$t(key);
      return label === key ? (this.$t('digitalhuman.status.processing') as string) : (label as string);
    },
    failureReason(): string | undefined {
      const err = this.modelValue?.response?.error;
      if (!err) return undefined;
      return typeof err === 'string' ? err : err?.message;
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
        await this.$store.dispatch('digitalhuman/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
    },
    onDownload(event: MouseEvent, url: string) {
      event?.stopPropagation();
      window.open(url, '_blank');
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
        &.info-state {
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
