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
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('veo.status.pending') }}) </span>
          <span v-if="Array.isArray(modelValue?.response?.data) && modelValue?.response?.data[0]?.state === 'running'">
            - ({{ $t('veo.status.processing') }})
          </span>
        </p>
      </div>
      <!-- Display success message -->
      <div
        v-if="modelValue?.response?.success === true && modelValue?.response?.data"
        :class="{ content: true, failed: true }"
      >
        <div v-if="modelValue?.response?.data[0]?.video_url" class="mb-4">
          <video-player :src="modelValue?.response?.data[0]?.video_url" />
        </div>
        <div v-if="modelValue?.response.success" :class="{ operations: true, 'mt-2': true }">
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'upsample', '1080p')"
          >
            {{ $t('veo.button.actionUpsample1080p') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'upsample', '4k')"
          >
            {{ $t('veo.button.actionUpsample4k') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'upsample', 'gif')"
          >
            {{ $t('veo.button.actionUpsampleGif') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'extend')"
          >
            {{ $t('veo.button.actionExtend') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'reshoot')"
          >
            {{ $t('veo.button.actionReshoot') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'object_insert')"
          >
            {{ $t('veo.button.actionObjectInsert') }}
          </el-button>
          <el-button
            v-if="modelValue?.response?.data[0]?.video_url"
            type="info"
            size="small"
            class="btn-action"
            @click="onPickAction($event, modelValue?.response, 'object_remove')"
          >
            {{ $t('veo.button.actionObjectRemove') }}
          </el-button>
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
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('veo.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('veo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('veo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('veo.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('veo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('veo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('veo.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('veo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="modelValue?.response?.success === undefined" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('veo.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('veo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('veo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
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
import { IVeoGenerateResponse } from '@/models';
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
    VideoPlayer,
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
    application() {
      return this.$store.state.veo?.application;
    },
    config() {
      return this.$store.state.veo?.config;
    }
  },
  methods: {
    onPickAction(_event: MouseEvent, response: IVeoGenerateResponse, action: string, upsampleAction?: string) {
      // Seed config so the user lands on the chosen post-processing form
      // with video_id + video_url already filled. Specific extra fields
      // (motion_type, prompt, image_mask, model) are left for the user
      // to fill in via the now-visible per-action inputs.
      console.debug('seed config from preview', { action, upsampleAction, response });
      this.$store.commit('veo/setConfig', {
        ...this.$store.state.veo?.config,
        action,
        // @ts-ignore
        video_id: response?.data?.[0]?.id,
        // @ts-ignore
        video_url: response?.data?.[0]?.video_url,
        ...(upsampleAction ? { upsample_action: upsampleAction } : {})
      });
    },
    onDownload(event: MouseEvent, video_url: string) {
      event.stopPropagation();
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
        &.failure {
          border-color: var(--el-color-danger);
        }
        &.success {
          border-color: var(--el-color-success);
        }
        &.info {
          border-color: var(--el-color-info);
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
