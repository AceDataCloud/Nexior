<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/8nxyy9.jpg" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('veo.name.veoBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <div
          v-if="referenceImages.length > 0"
          class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto"
        >
          <image-preview
            v-for="(url, idx) in referenceImages"
            :key="`${idx}-${url}`"
            :url="url"
            :name="`reference-${idx + 1}`"
            :closable="false"
          />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('veo.status.pending') }}) </span>
          <span v-if="Array.isArray(modelValue?.response?.data) && modelValue?.response?.data[0]?.state === 'running'">
            - ({{ $t('veo.status.processing') }})
          </span>
        </p>
      </div>
      <div
        v-if="modelValue?.response?.success === true && modelValue?.response?.data"
        :class="{ content: true, failed: true }"
      >
        <div v-if="modelValue?.response?.data[0]?.video_url" class="mb-4">
          <video-player :src="modelValue?.response?.data[0]?.video_url" />
        </div>
        <div v-if="modelValue?.response.success" :class="{ operations: true, 'mt-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('veo.message.downloadVideo')" placement="top-start">
            <el-button
              v-if="modelValue?.response?.data[0]?.video_url"
              type="info"
              size="small"
              class="btn-action"
              @click="onDownload($event, modelValue?.response?.data[0]?.video_url)"
            >
              {{ $t('veo.button.download') }}
            </el-button>
          </el-tooltip>
          <api-code-button path="/veo/videos" :body="modelValue?.request" />
        </div>
      </div>
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('veo.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('veo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
        </el-alert>
      </div>
      <div :class="{ content: true }">
        <el-alert :closable="false" :class="['mt-2', 'task-metadata', taskInfoClass]">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('veo.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-bolt" class="mr-1" />
            {{ $t('veo.name.action') }}:
            {{ actionLabel }}
          </p>
          <p v-if="modelValue?.request?.aspect_ratio" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="mr-1" />
            {{ $t('veo.name.ratio') }}:
            {{ modelValue?.request?.aspect_ratio }}
          </p>
          <p
            v-if="modelValue?.request?.translation !== undefined"
            class="text-[var(--el-text-color-regular)] text-xs mb-2"
          >
            <font-awesome-icon icon="fa-solid fa-language" class="mr-1" />
            {{ $t('veo.name.translation') }}:
            {{ $t(modelValue?.request?.translation ? 'seedance.button.on' : 'seedance.button.off') }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('veo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('veo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="traceId" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('veo.name.traceId') }}:
            {{ traceId }}
            <copy-to-clipboard :content="traceId" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { IVeoTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    VideoPlayer,
    ImagePreview,
    ElTooltip,
    ElButton,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IVeoTask | undefined,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    referenceImages(): string[] {
      const imageUrls = this.modelValue?.request?.image_urls;
      return Array.isArray(imageUrls) ? imageUrls.filter((url): url is string => typeof url === 'string' && !!url) : [];
    },
    actionLabel(): string {
      const request = this.modelValue?.request;
      const inferredAction =
        request?.model === 'veo31-fast-ingredients' || this.referenceImages.length > 2
          ? 'ingredients2video'
          : this.referenceImages.length > 0
            ? 'image2video'
            : 'text2video';
      const action = request?.action || inferredAction;
      const labels: Record<string, string> = {
        text2video: 'veo.button.action1',
        image2video: 'veo.button.action2',
        ingredients2video: 'veo.button.actionIngredients'
      };
      return this.$t(labels[action] || 'veo.name.action') as string;
    },
    traceId(): string | undefined {
      return this.modelValue?.response?.trace_id || this.modelValue?.trace_id;
    },
    taskInfoClass(): string {
      if (this.modelValue?.response?.success === true) return 'success';
      if (this.modelValue?.response?.success === false) return 'failure';
      return 'info';
    }
  },
  methods: {
    onDownload(event: MouseEvent, video_url: string) {
      event?.stopPropagation();
      console.log('on download');
      // download url here
      window.open(video_url, '_blank');
    },
    onOpenVideo(url: string) {
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
        &.task-metadata {
          :deep(p) {
            color: var(--el-text-color-regular);
          }
        }
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
      overflow-y: scroll;

      &.full {
        height: 70px;
      }

      .btn-action {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
