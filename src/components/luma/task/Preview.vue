<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/ahjfwi.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('luma.name.lumaBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('luma.status.pending') }}) </span>
          <span v-if="modelValue?.response?.state === 'processing' || modelValue?.response?.state === 'pending'">
            - ({{ $t('luma.status.processing') }})
          </span>
        </p>
      </div>
      <!-- Display success message -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div v-if="modelValue.response.video_url" class="mb-4">
          <video-player :src="modelValue.response.video_url" />
        </div>
        <div v-if="modelValue?.response && !config?.custom" :class="{ operations: true, 'mt-2': true, 'mb-4': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('luma.message.extendVideo')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onExtend($event, modelValue?.response)">
              {{ $t('luma.button.extend') }}
            </el-button>
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" :content="$t('luma.message.downloadVideo')" placement="top-start">
            <el-button
              type="info"
              size="small"
              class="btn-action"
              @click.stop="onDownload(modelValue?.response?.video_url)"
            >
              {{ $t('luma.button.download') }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('luma.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div
        v-if="modelValue?.response?.state === 'failed' || modelValue?.response?.success === false"
        :class="{ content: true }"
      >
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('luma.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('luma.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('luma.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('luma.name.traceId') }}:
            {{ modelValue?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div
        v-if="
          !modelValue?.response ||
          modelValue?.response?.state === 'processing' ||
          modelValue?.response?.state === 'pending'
        "
        :class="{ content: true }"
      >
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('luma.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('luma.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { ILumaTask, ILumaGenerateResponse } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    VideoPlayer,
    ElTooltip,
    ElButton
  },
  props: {
    modelValue: {
      type: Object as () => ILumaTask | undefined,
      required: true
    }
  },
  emits: ['extend'],
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.luma?.application;
    },
    config() {
      return this.$store.state.luma?.config;
    }
  },
  methods: {
    onExtend(_event: MouseEvent, response: ILumaGenerateResponse) {
      // extend url here
      console.debug('set config', response);
      this.$store.commit('luma/setConfig', {
        ...this.$store.state.luma?.config,
        video_id: response.video_id,
        prompt: response.prompt,
        action: 'extend',
        thumbnail_url: response.thumbnail_url,
        video_url: response.video_url
      });
      this.$emit('extend');
    },
    onDownload(video_url: string) {
      // download url here
      window.open(video_url, '_blank');
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
      background-color: rgb(0, 0, 0);
      padding: 2px;
      width: 50px;
      height: 50px;
      margin: 10px;
      border-radius: 50%;
    }
  }

  .main {
    flex: 1;
    width: calc(100% - $left-width);
    padding: 10px 10px 0 10px;

    .bot {
      font-size: 16px;
      font-weight: bold;
      color: rgb(46, 204, 113);
      margin-bottom: 0;
      margin-top: 0;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
    }

    .info {
      .prompt {
        font-size: 14px;
        font-weight: bold;
        color: var(--el-text-color-regular);
        margin-bottom: 10px;
      }
    }

    .content {
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
  }
}
</style>
