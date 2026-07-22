<template>
  <div class="preview">
    <div class="left">
      <capability-presentation capability="maestro" part="avatar" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        <capability-presentation capability="maestro" part="name" />
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
        <div v-if="files.length" class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto">
          <template v-for="(file, idx) in files" :key="idx">
            <image-preview v-if="file.kind === 'image'" :url="file.url" :name="file.name" :closable="false" />
            <video-preview v-else-if="file.kind === 'video'" :url="file.url" :name="file.name" />
            <audio-preview v-else-if="file.kind === 'audio'" :url="file.url" :name="file.name" />
            <a
              v-else
              :href="file.url"
              :title="file.name"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 no-underline"
            >
              <file-preview :name="file.name" :closable="false" />
            </a>
          </template>
        </div>
        <div
          v-if="referenceLoadFailed && referenceTaskId && !referenceTask"
          class="reference-load-failed flex items-center gap-1 mt-2 text-xs text-[var(--el-text-color-secondary)]"
        >
          <info-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          <span>{{ $t('maestro.name.files') }}: {{ $t('maestro.name.failure') }}</span>
          <el-button
            class="reference-retry"
            size="small"
            text
            circle
            :title="$t('codingBridge.session.retry')"
            :aria-label="$t('codingBridge.session.retry')"
            @click="retryReferenceTask"
          >
            <redo-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </el-button>
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!isTerminal" class="progress-pct"> · {{ progressText }}</span>
        </p>
      </div>

      <!-- in-progress: step checklist + overall percentage + task id, in the same bordered card as success/failure -->
      <div v-if="!isTerminal" class="content">
        <el-alert :closable="false" class="mt-2 processing">
          <progress-steps :model-value="modelValue" />
          <p
            v-for="(param, pIdx) in requestParams"
            :key="`param-${pIdx}`"
            class="text-[var(--el-text-color-regular)] text-xs mb-2"
            :class="{ 'mt-3': pIdx === 0 }"
          >
            <component :is="param.icon" class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ param.label }}: {{ param.value }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="traceId" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.traceId') }}: {{ traceId }}
            <copy-to-clipboard :content="traceId" />
          </p>
        </el-alert>
      </div>

      <!-- success: one player per language variant -->
      <div v-if="modelValue?.response?.success === true && variants.length" class="content">
        <div v-for="(variant, vi) in variants" :key="vi" class="mb-4">
          <p class="text-xs text-[var(--el-text-color-secondary)] mb-1">
            <language-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />{{ variant.lang
            }}<span v-if="variant.title"> · {{ variant.title }}</span>
          </p>
          <video-player v-if="variant.output_url" :src="variant.output_url" />
        </div>
        <!-- all actions in one row: download (per variant) · remix · view code -->
        <div class="operations">
          <template v-for="(variant, vi) in variants" :key="vi">
            <el-button
              v-if="variant.output_url"
              type="info"
              size="small"
              class="btn-action"
              @click="onDownload($event, variant.output_url)"
            >
              <download-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
              {{ $t('maestro.button.download') }}<span v-if="variants.length > 1"> · {{ variant.lang }}</span>
            </el-button>
          </template>
          <el-button size="small" type="primary" class="btn-action" @click="onRemix">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.button.remix') }}
          </el-button>
          <api-code-button path="/maestro/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p
            v-for="(param, pIdx) in requestParams"
            :key="`param-${pIdx}`"
            class="text-[var(--el-text-color-regular)] text-xs mb-2"
          >
            <component :is="param.icon" class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ param.label }}: {{ param.value }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="traceId" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.traceId') }}: {{ traceId }}
            <copy-to-clipboard :content="traceId" />
          </p>
        </el-alert>
      </div>

      <!-- failure -->
      <div v-if="modelValue?.response?.success === false" class="content">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.failure') }}
          </template>
          <p
            v-for="(param, pIdx) in requestParams"
            :key="`param-${pIdx}`"
            class="text-[var(--el-text-color-regular)] text-xs mb-2"
          >
            <component :is="param.icon" class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ param.label }}: {{ param.value }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="failureReason" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.failureReason') }}: {{ failureReason }}
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="traceId" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('maestro.name.traceId') }}: {{ traceId }}
            <copy-to-clipboard :content="traceId" />
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
  DownloadIcon,
  FullscreenIcon,
  InfoIcon,
  LanguageIcon,
  MagicIcon,
  PaletteIcon,
  PerformanceIcon,
  RedoIcon,
  TimeIcon,
  VideoIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent, markRaw, type Component } from 'vue';
import { ElAlert, ElButton, ElMessage, ElMessageBox, ElTooltip } from 'element-plus';
import { IMaestroTask, IMaestroVariant } from '@/models';
import { MAESTRO_ACTION_REMIX } from '@/constants';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import AudioPreview from '@/components/common/AudioPreview.vue';
import VideoPreview from '@/components/common/VideoPreview.vue';
import FilePreview from '@/components/common/FilePreview.vue';
import { isImageUrl, isVideoUrl, isAudioUrl } from '@/utils/is';
import { buildMaestroRemixConfig } from '@/utils/maestro';
import { getMaestroReferenceTask } from './referenceTask';
import ProgressSteps from './ProgressSteps.vue';

const TERMINAL = ['succeeded', 'failed'];
const REFERENCE_RETRY_DELAYS_MS = [1000, 3000];

type MaestroFileKind = 'image' | 'video' | 'audio' | 'file';
interface IMaestroInputFile {
  url: string;
  name: string;
  kind: MaestroFileKind;
}

export default defineComponent({
  name: 'TaskPreview',
  components: {
    DeleteIcon,
    ElTooltip,
    ChannelIcon,
    DownloadIcon,
    InfoIcon,
    LanguageIcon,
    MagicIcon,
    RedoIcon,
    TimeIcon,
    WarningIcon,
    CopyToClipboard,
    ElAlert,
    VideoPlayer,
    ElButton,
    ApiCodeButton,
    ImagePreview,
    AudioPreview,
    VideoPreview,
    FilePreview,
    ProgressSteps
  },
  props: {
    modelValue: {
      type: Object as () => IMaestroTask | undefined,
      required: true
    }
  },
  data() {
    return {
      fetchedReferenceTask: undefined as IMaestroTask | undefined,
      fetchedReferenceKey: undefined as string | undefined,
      referenceLoadAttempt: 0,
      referenceLoadFailed: false,
      referenceLoadTimer: undefined as number | undefined,
      referenceLoadVersion: 0
    };
  },
  computed: {
    variants(): IMaestroVariant[] {
      return this.modelValue?.response?.data?.variants || [];
    },
    files(): IMaestroInputFile[] {
      const request = this.modelValue?.request;
      const urls = [...(request?.file_urls || [])];
      if (this.referenceTaskId) {
        for (const variant of this.referenceTask?.response?.data?.variants || []) {
          if (variant.output_url) urls.push(variant.output_url);
        }
      }
      return [...new Set(urls)]
        .filter((url): url is string => !!url)
        .map((url) => {
          const clean = url.split('?')[0].split('#')[0];
          const kind: MaestroFileKind = isImageUrl(clean)
            ? 'image'
            : isVideoUrl(clean)
              ? 'video'
              : isAudioUrl(clean)
                ? 'audio'
                : 'file';
          return { url, name: this.fileName(clean), kind };
        });
    },
    referenceTaskId(): string | undefined {
      const request = this.modelValue?.request;
      return request?.action === MAESTRO_ACTION_REMIX ? request?.ref_task_id : undefined;
    },
    referenceLoadKey(): string | undefined {
      const credential = this.$store.state.maestro?.credential;
      const token = credential?.token;
      if (!this.referenceTaskId || !token) return undefined;
      return JSON.stringify([this.referenceTaskId, credential?.id || credential?.user_id || token, token]);
    },
    referenceTask(): IMaestroTask | undefined {
      if (!this.referenceTaskId) return undefined;
      return (
        this.$store.state.maestro?.tasks?.items?.find((task: IMaestroTask) => task.id === this.referenceTaskId) ||
        (this.fetchedReferenceKey === this.referenceLoadKey ? this.fetchedReferenceTask : undefined)
      );
    },
    isTerminal(): boolean {
      return TERMINAL.includes(this.modelValue?.status || '');
    },
    traceId(): string | undefined {
      return this.modelValue?.trace_id || this.modelValue?.response?.trace_id;
    },
    progressPct(): number | undefined {
      const progress = this.modelValue?.response?.data?.progress;
      const last = progress?.length ? progress[progress.length - 1] : undefined;
      return typeof last?.pct === 'number' ? last.pct : undefined;
    },
    progressText(): string {
      return this.progressPct !== undefined ? `${this.progressPct}%` : this.statusLabel;
    },
    statusLabel(): string {
      const s = this.modelValue?.status || 'pending';
      const key = `maestro.status.${s}`;
      const label = this.$t(key);
      return label === key ? (this.$t('maestro.status.processing') as string) : (label as string);
    },
    failureReason(): string | undefined {
      const err = this.modelValue?.response?.error;
      if (!err) return undefined;
      return typeof err === 'string' ? err : err?.message;
    },
    requestParams(): { icon: Component; label: string; value: string }[] {
      const req = this.modelValue?.request;
      if (!req) return [];
      const out: { icon: Component; label: string; value: string }[] = [];
      if (req.action) {
        out.push({
          icon: markRaw(MagicIcon),
          label: this.$t('maestro.name.mode') as string,
          value: this.optionLabel('maestro.option.action', req.action)
        });
      }
      if (req.scenario) {
        out.push({
          icon: markRaw(VideoIcon),
          label: this.$t('maestro.name.scenario') as string,
          value: this.optionLabel('maestro.option.scenario', req.scenario)
        });
      }
      if (req.style) {
        out.push({
          icon: markRaw(PaletteIcon),
          label: this.$t('maestro.name.style') as string,
          value: this.optionLabel('maestro.option.style', req.style)
        });
      }
      if (req.quality) {
        out.push({
          icon: markRaw(PerformanceIcon),
          label: this.$t('maestro.name.quality') as string,
          value: this.optionLabel('maestro.option.quality', req.quality)
        });
      }
      if (req.aspect) {
        out.push({
          icon: markRaw(FullscreenIcon),
          label: this.$t('maestro.name.aspect') as string,
          value: req.aspect
        });
      }
      if (req.duration) {
        out.push({
          icon: markRaw(TimeIcon),
          label: this.$t('maestro.name.duration') as string,
          value: `${req.duration}s`
        });
      }
      if (req.langs?.length) {
        out.push({
          icon: markRaw(LanguageIcon),
          label: this.$t('maestro.name.langs') as string,
          value: req.langs.join(' · ')
        });
      }
      return out;
    }
  },
  watch: {
    referenceLoadKey: {
      immediate: true,
      handler(referenceLoadKey: string | undefined) {
        this.resetReferenceLoad();
        if (referenceLoadKey && !this.referenceTask) void this.loadReferenceTask(referenceLoadKey);
      }
    }
  },
  beforeUnmount() {
    this.resetReferenceLoad();
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
        await this.$store.dispatch('maestro/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
    },
    resetReferenceLoad(): void {
      if (this.referenceLoadTimer !== undefined) window.clearTimeout(this.referenceLoadTimer);
      this.referenceLoadTimer = undefined;
      this.referenceLoadVersion += 1;
      this.referenceLoadAttempt = 0;
      this.referenceLoadFailed = false;
      this.fetchedReferenceTask = undefined;
      this.fetchedReferenceKey = undefined;
    },
    async loadReferenceTask(referenceLoadKey: string): Promise<void> {
      if (referenceLoadKey !== this.referenceLoadKey || this.referenceTask) return;
      const credential = this.$store.state.maestro?.credential;
      const token = credential?.token;
      const taskId = this.referenceTaskId;
      if (!taskId || !token) return;
      const credentialKey = credential?.id || credential?.user_id || token;
      const version = this.referenceLoadVersion;
      this.referenceLoadAttempt += 1;
      const task = await getMaestroReferenceTask(taskId, { token, credentialKey });
      if (version !== this.referenceLoadVersion || referenceLoadKey !== this.referenceLoadKey) return;
      if (task) {
        this.fetchedReferenceTask = task;
        this.fetchedReferenceKey = referenceLoadKey;
        this.referenceLoadFailed = false;
        return;
      }
      const retryDelay = REFERENCE_RETRY_DELAYS_MS[this.referenceLoadAttempt - 1];
      if (retryDelay !== undefined) {
        this.referenceLoadTimer = window.setTimeout(() => {
          this.referenceLoadTimer = undefined;
          void this.loadReferenceTask(referenceLoadKey);
        }, retryDelay);
      } else {
        this.referenceLoadFailed = true;
      }
    },
    retryReferenceTask(): void {
      const referenceLoadKey = this.referenceLoadKey;
      this.resetReferenceLoad();
      if (referenceLoadKey) void this.loadReferenceTask(referenceLoadKey);
    },
    optionLabel(prefix: string, value: string): string {
      const key = `${prefix}.${value}`;
      const label = this.$t(key) as string;
      return label === key ? value : label;
    },
    fileName(url: string): string {
      const base = url.substring(url.lastIndexOf('/') + 1);
      try {
        return decodeURIComponent(base) || url;
      } catch {
        return base || url;
      }
    },
    onDownload(event: MouseEvent, url: string) {
      event?.stopPropagation();
      window.open(url, '_blank');
    },
    onRemix() {
      if (!this.modelValue) return;
      const patch = buildMaestroRemixConfig(this.$store.state.maestro?.config, this.modelValue);
      this.$store.commit('maestro/setConfig', patch);
      ElMessage.info(this.$t('maestro.message.remixLoaded'));
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
        .progress-pct {
          font-weight: 600;
          color: var(--el-color-primary);
          white-space: nowrap;
        }
      }
    }

    .content {
      word-break: break-word;
      overflow-wrap: anywhere;

      .el-alert {
        border-left-width: 2px;
        border-left-style: solid;
        &.processing {
          border-color: var(--el-color-primary);
        }
        &.failure {
          border-color: var(--el-color-danger);
        }
        &.success {
          border-color: var(--el-color-success);
        }
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
