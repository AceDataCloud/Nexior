<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/viy61r.jpg" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('pixverse.name.pixverseBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('pixverse.status.pending') }}) </span>
          <span
            v-if="
              modelValue?.response?.data &&
              (modelValue?.response?.data[0]?.state === 'processing' ||
                modelValue?.response?.data[0]?.state === 'pending')
            "
          >
            - ({{ $t('pixverse.status.processing') }})
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
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="$t('pixverse.message.downloadVideo')"
            placement="top-start"
          >
            <el-button
              v-if="modelValue?.response?.data[0]?.video_url"
              type="info"
              size="small"
              class="btn-action"
              @click="onDownload($event, modelValue?.response?.data[0]?.video_url)"
            >
              {{ $t('pixverse.button.download') }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('pixverse.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('pixverse.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('pixverse.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('pixverse.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('pixverse.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('pixverse.name.traceId') }}:
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
import { IPixverseTask } from '@/models';
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
      type: Object as () => IPixverseTask | undefined,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.pixverse?.application;
    },
    config() {
      return this.$store.state.pixverse?.config;
    }
  },
  methods: {
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
        font-size: 16px;
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

<style lang="scss">
.preview {
  .image.error {
    background: var(--el-bg-color-page);
    .image-slot {
      font-size: 14px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .failure {
    background: var(--el-fill-color-light);
    width: 100%;
    .el-alert__content {
      p {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
