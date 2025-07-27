<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/0qg4gp.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('hailuo.name.hailuoBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('hailuo.status.pending') }}) </span>
          <span v-if="video?.state === 'processing' || video?.state === 'pending' || video?.state === 'running'">
            - ({{ $t('hailuo.status.processing') }})
          </span>
        </p>
      </div>
      <!-- Display success message -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
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
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('hailuo.name.model') }}:
            {{ modelValue?.request?.model }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('hailuo.name.failure') }}
          </template>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('hailuo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('hailuo.name.traceId') }}:
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
            {{ $t('hailuo.name.failure') }}
          </template>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
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
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { IHailuoTask, IHailuoVideo } from '@/models';
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
      type: Object as () => IHailuoTask | undefined,
      required: true
    }
  },
  computed: {
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
      border: 1px solid var(--el-border-color);
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
