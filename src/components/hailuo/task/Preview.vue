<template>
  <div v-for="(video, videoIndex) in videos" :key="videoIndex" class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/4tfwwz.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('hailuo.name.hailuoBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat(modelValue?.created_at || '') * 1000)) }}
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
        <div class="image-wrapper">
          <VideoPlayer :model-value="video" />
        </div>
        <div v-if="video" :class="{ operations: true, 'mt-2': true }">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="$t('hailuo.message.downloadVideo')"
            placement="top-start"
          >
            <el-button type="info" size="small" class="btn-action" @click="onDownload($event, video?.video_url)">
              {{ $t('hailuo.button.download') }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
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
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('hailuo.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('hailuo.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div
        v-if="
          !modelValue?.response ||
          video?.state === 'processing' ||
          video?.state === 'pending' ||
          video?.state === 'running'
        "
        :class="{ content: true }"
      >
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('hailuo.name.failure') }}
          </template>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('hailuo.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { IHailuoTask, IHailuoGenerateResponse, IHailuoVideo } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '../VideoPlayer.vue';
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
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.hailuo?.application;
    },
    config() {
      return this.$store.state.hailuo?.config;
    },
    videos(): IHailuoVideo[] {
      let result: IHailuoVideo[] = [];
      // @ts-ignore
      const action = this.modelValue?.request?.action;
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          let audio = item as IHailuoVideo;
          // Add the action field to the audio object
          if (action) {
            audio.action = action;
          }
          result.push(audio);
        });
      }
      return result;
    }
  },
  methods: {
    onExtend(event: MouseEvent, response: IHailuoGenerateResponse) {
      event.stopPropagation();
      // extend url here
      console.debug('set config', response);
      this.$store.commit('hailuo/setConfig', {
        ...this.$store.state.hailuo?.config,
        video_id: response.video_id,
        prompt: response.prompt,
        action: 'extend',
        thumbnail_url: response.thumbnail_url,
        video_url: response.video_url
      });
    },
    onDownload(event: MouseEvent, video_url: string) {
      event.stopPropagation();
      console.log('on download');
      // download url here
      window.open(video_url, '_blank');
    },
    onReload(event: Event) {
      const target = event.target as HTMLImageElement;
      // append a random url query to existing url query, to force reload the image
      // extract exiting url query
      const url = new URL(target.src);
      // extract `retry` query
      const retry = url.searchParams.get('retry');
      if (!retry) {
        // if no retry query, set it as random string
        url.searchParams.set('retry', '1');
      } else if (parseInt(retry) < 2) {
        // if retry < 3, increase it by 1
        url.searchParams.set('retry', (parseInt(retry) + 1).toString());
      } else {
        return;
      }
      // set the new url
      target.src = url.toString();
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
      background-color: rgb(85, 131, 186);
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

    .image-wrapper {
      position: relative;
      width: fit-content;
      min-height: 50px;
      min-width: 100px;
      .image {
        max-height: 400px;
        max-width: 500px;
        display: block;
        width: fit-content;
      }
      .btn-raw {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        display: none;
      }
      .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: white;
        z-index: 500;
        pointer-events: none; /* Ensure the icon doesn't interfere with hover */
      }
      &:hover {
        .image {
          filter: brightness(0.6);
        }
        .btn-raw {
          display: block;
        }

        .play-icon {
          display: none;
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
