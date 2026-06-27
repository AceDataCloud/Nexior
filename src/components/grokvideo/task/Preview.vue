<template>
  <div class="preview">
    <div class="left">
      <el-image :src="grokVideoLogo" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('grokvideo.name.bot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <div v-if="inputImage" class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto">
          <image-preview :url="inputImage" name="image" :closable="false" />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('grokvideo.status.pending') }}) </span>
          <span v-else-if="video?.state === 'processing' || video?.state === 'pending'">
            - ({{ $t('grokvideo.status.processing') }})
          </span>
        </p>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-regular fa-clock" class="mr-1" />
            {{ $t('grokvideo.status.pending') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('grokvideo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="pendingElapsed !== undefined" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('grokvideo.name.elapsed') }}: {{ pendingElapsed }}s
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === true" :class="{ content: true }">
        <div v-if="video?.video_url" class="mb-4">
          <video-player :src="video?.video_url" />
        </div>
        <div v-if="video?.video_url" :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="$t('grokvideo.message.downloadVideo')"
            placement="top-start"
          >
            <el-button type="info" size="small" class="btn-action" @click.stop="onDownload(video?.video_url)">
              {{ $t('grokvideo.button.download') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/grok/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('grokvideo.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p v-if="video?.duration" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('grokvideo.name.duration') }}: {{ video?.duration }}s
          </p>
          <p v-if="modelValue?.request?.resolution" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-expand" class="mr-1" />
            {{ $t('grokvideo.name.resolution') }}:
            {{ modelValue?.request?.resolution }}
            <span v-if="modelValue?.request?.aspect_ratio"> · {{ modelValue?.request?.aspect_ratio }}</span>
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('grokvideo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('grokvideo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('grokvideo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('grokvideo.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('grokvideo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.response?.error?.message" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('grokvideo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('grokvideo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-else :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('grokvideo.name.status') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('grokvideo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { IGrokVideoTask, IGrokVideoVideo } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';
import { GROKVIDEO_LOGO } from '@/constants';

export default defineComponent({
  name: 'GrokVideoTaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    VideoPlayer,
    ElTooltip,
    ElButton,
    ImagePreview,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IGrokVideoTask | undefined,
      required: true
    }
  },
  data() {
    return {
      grokVideoLogo: GROKVIDEO_LOGO,
      nowTs: Date.now(),
      timer: 0
    };
  },
  computed: {
    video(): IGrokVideoVideo | undefined {
      return this.modelValue?.response?.data?.[0];
    },
    inputImage(): string | undefined {
      return this.modelValue?.request?.image_url;
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
}
</style>
