<template>
  <div class="preview">
    <div class="left">
      <el-image :src="DIGITALHUMAN_LOGO" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('digitalhuman.name.bot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.text" class="prompt mt-2">
          {{ modelValue?.request?.text }}
          <span v-if="!isTerminal"> - ({{ statusLabel }}) </span>
        </p>
        <p v-else class="prompt mt-2">
          {{ voiceLabel }}
          <span v-if="!isTerminal"> - ({{ statusLabel }}) </span>
        </p>
        <p class="text-xs text-[var(--el-text-color-secondary)] mb-1">
          <font-awesome-icon :icon="faceIcon" class="mr-1" />{{ faceLabel }}
          <span class="ml-2"><font-awesome-icon icon="fa-solid fa-sliders" class="mr-1" />{{ engineLabel }}</span>
        </p>
      </div>

      <!-- in-progress: status + percentage -->
      <div v-if="!isTerminal" class="content">
        <p class="text-xs text-[var(--el-text-color-secondary)] mb-1">{{ statusLabel }}</p>
        <el-progress :percentage="progressPct" :stroke-width="6" />
      </div>

      <!-- success: the talking-head video -->
      <div v-if="isSuccess" class="content">
        <video-player v-if="videoUrl" :src="videoUrl" />
        <div class="operations mt-2">
          <el-button v-if="videoUrl" type="info" size="small" class="btn-action" @click="onDownload($event, videoUrl)">
            {{ $t('digitalhuman.button.download') }}
          </el-button>
          <api-code-button path="/digital-human/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-user" class="mr-1" />
            {{ $t('digitalhuman.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('digitalhuman.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>

      <!-- failure -->
      <div v-if="isFailure" class="content">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('digitalhuman.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-user" class="mr-1" />
            {{ $t('digitalhuman.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="failureReason" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('digitalhuman.name.failureReason') }}: {{ failureReason }}
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElProgress } from 'element-plus';
import { IDigitalHumanTask } from '@/models';
import { DIGITALHUMAN_LOGO } from '@/constants';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    ElProgress,
    VideoPlayer,
    ElButton,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IDigitalHumanTask | undefined,
      required: true
    }
  },
  data() {
    return {
      DIGITALHUMAN_LOGO
    };
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
    faceLabel(): string {
      return this.modelValue?.request?.image_url
        ? (this.$t('digitalhuman.name.facePhoto') as string)
        : (this.$t('digitalhuman.name.faceVideo') as string);
    },
    faceIcon(): string {
      return this.modelValue?.request?.image_url ? 'fa-solid fa-image' : 'fa-solid fa-film';
    },
    engineLabel(): string {
      return this.modelValue?.request?.engine || this.modelValue?.response?.engine || 'latentsync';
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
      font-size: 16px;
      font-weight: bold;
      color: var(--el-color-primary);
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
        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
