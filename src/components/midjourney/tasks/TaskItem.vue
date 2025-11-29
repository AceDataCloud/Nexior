<template>
  <div v-if="modelValue?.type === 'imagine'" class="item">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/wto43b.png" class="avatar" />
    </div>
    <div class="preview">
      <div class="bot">
        {{ $t('midjourney.name.midjourneyBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span v-if="modelValue?.response?.progress !== undefined && modelValue?.response?.progress !== 100">
            - ({{ modelValue?.response?.progress }}%)
          </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
        <p v-if="modelValue?.request?.image_id" class="prompt">
          {{ modelValue?.request?.image_id }} - {{ modelValue?.request?.action }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
      </div>
      <!-- response error -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true, full: full, failed: true }">
        <el-alert :closable="false" class="failure">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('midjourney.field.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- response success -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, full: full }">
        <image-wrapper
          v-if="modelValue?.response?.raw_image_url"
          :src="modelValue?.response?.image_url"
          :raw-src="modelValue?.response?.raw_image_url"
        />
        <div v-if="modelValue?.response?.actions" :class="{ operations: true, full }">
          <el-tooltip
            v-for="(action, actionKey) in modelValue?.response?.actions"
            :key="actionKey"
            class="box-item"
            effect="dark"
            :content="getActionDescriptionWithPrice(action, modelValue?.request?.mode)"
            placement="top-start"
          >
            <el-button
              v-show="actionMapping[action]"
              type="info"
              size="small"
              class="btn-action"
              @click="onCustom(action)"
            >
              {{ actionMapping[action] }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.trace_id }}
            <copy-to-clipboard :content="modelValue?.trace_id" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-image" class="mr-1" />
            {{ $t('midjourney.field.imageId') }}:
            {{ modelValue?.response?.image_id }}
            <copy-to-clipboard :content="modelValue?.response?.image_id" />
          </p>
        </el-alert>
      </div>
      <!-- response pending -->
      <div v-if="!modelValue?.response">
        <el-alert :closable="false" class="mt-2 info">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
  <div v-if="modelValue?.type === 'videos'" class="item">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/wto43b.png" class="avatar" />
    </div>
    <div class="preview">
      <div class="bot">
        {{ $t('midjourney.name.midjourneyBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span v-if="modelValue?.response?.progress !== undefined && modelValue?.response?.progress !== 100">
            - ({{ modelValue?.response?.progress }}%)
          </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
        <p v-if="modelValue?.request?.video_id" class="prompt">
          {{ modelValue?.request?.video_id }} - {{ modelValue?.request?.action }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
      </div>
      <!-- response error -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true, full: full, failed: true }">
        <el-alert :closable="false" class="failure">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('midjourney.field.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- response success -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, full: full }">
        <div v-if="modelValue?.response.video_urls" class="mb-4">
          <video-player :src="modelValue?.response.video_urls[0]" />
        </div>
        <div
          v-if="modelValue?.response && modelValue?.response?.video_urls"
          :class="{ operations: true, 'mt-2': true, 'mb-4': true }"
        >
          <el-tooltip class="box-item" effect="dark" :content="$t('luma.message.extendVideo')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onExtend($event, modelValue?.response)">
              {{ $t('midjourney.button.extend') }}
            </el-button>
          </el-tooltip>
          <el-tooltip class="box-item" effect="dark" :content="$t('luma.message.downloadVideo')" placement="top-start">
            <el-button
              type="info"
              size="small"
              class="btn-action"
              @click.stop="onDownload(modelValue.response.video_urls[0])"
            >
              {{ $t('midjourney.button.download') }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.trace_id }}
            <copy-to-clipboard :content="modelValue?.trace_id" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-image" class="mr-1" />
            {{ $t('midjourney.field.videoId') }}:
            {{ modelValue?.response?.video_id }}
            <copy-to-clipboard :content="modelValue?.response?.video_id" />
          </p>
        </el-alert>
      </div>
      <!-- response pending -->
      <div v-if="!modelValue?.response">
        <el-alert :closable="false" class="info">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
  <div v-if="modelValue?.type === 'describe'" class="item">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/wto43b.png" class="avatar" />
    </div>
    <div class="preview">
      <div class="bot">
        {{ $t('midjourney.name.midjourneyBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.image_url" class="prompt">
          {{ modelValue?.request?.image_url }}
          <span v-if="!modelValue?.response?.descriptions"> - ({{ $t('midjourney.status.describePending') }}) </span>
          <span v-if="modelValue?.response?.descriptions"> - ({{ $t('midjourney.status.describeComplete') }}) </span>
        </p>
      </div>
      <!-- response error -->
      <div
        v-if="modelValue?.response && !modelValue?.response?.descriptions"
        :class="{ content: true, full: full, failed: true }"
      >
        <el-alert :closable="false" class="failure">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('midjourney.field.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.trace_id }}
            <copy-to-clipboard :content="modelValue?.trace_id" />
          </p>
        </el-alert>
      </div>
      <div v-if="modelValue?.response?.descriptions" :class="{ content: true, full: full }">
        <div class="mb-2">
          <div class="mb-2">
            <div v-for="(description, index) in modelValue.response.descriptions" :key="index" class="flex items-start">
              <div v-if="description !== ''">
                <el-tag effect="dark" size="small" type="primary" round class="mr-1">
                  {{ index + 1 }}
                </el-tag>
                <span class="text-sm text-[var(--el-text-color-primary)]">
                  {{ description }}
                  <copy-to-clipboard :content="description" />
                </span>
              </div>
            </div>
          </div>
          <image-wrapper
            v-if="modelValue?.request?.image_url"
            :src="modelValue?.request?.image_url"
            :raw-src="modelValue?.request?.image_url"
            class="image w-full rounded-lg"
          />
        </div>
        <el-alert :closable="false" class="success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.trace_id }}
            <copy-to-clipboard :content="modelValue?.trace_id" />
          </p>
        </el-alert>
      </div>
      <!-- response pending -->
      <div v-if="!modelValue?.response">
        <el-alert :closable="false" class="info">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
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
import { ElImage, ElButton, ElTooltip, ElAlert, ElTag } from 'element-plus';
import { IMidjourneyTask, MidjourneyImagineAction, MidjourneyImagineState, IMidjourneyVideosResponse } from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import { getConsumption } from '@/utils';
interface IData {
  midjourneyImagineState: typeof MidjourneyImagineState;
  actionMapping: Record<MidjourneyImagineAction, string>;
  descriptionMapping: Record<MidjourneyImagineAction, string>;
}

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ImageWrapper,
    ElButton,
    FontAwesomeIcon,
    ElTooltip,
    ElAlert,
    ElTag,
    CopyToClipboard,
    VideoPlayer
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyTask | undefined,
      required: true
    },
    full: {
      type: Boolean,
      default: false
    }
  },
  emits: ['custom'],
  data(): IData {
    return {
      midjourneyImagineState: MidjourneyImagineState,
      actionMapping: {
        [MidjourneyImagineAction.GENERATE]: 'Generate',
        [MidjourneyImagineAction.UPSCALE1]: 'U1',
        [MidjourneyImagineAction.UPSCALE2]: 'U2',
        [MidjourneyImagineAction.UPSCALE3]: 'U3',
        [MidjourneyImagineAction.UPSCALE4]: 'U4',
        [MidjourneyImagineAction.VARIATION1]: 'V1',
        [MidjourneyImagineAction.VARIATION2]: 'V2',
        [MidjourneyImagineAction.VARIATION3]: 'V3',
        [MidjourneyImagineAction.VARIATION4]: 'V4',
        [MidjourneyImagineAction.VARIATION_STRONG]: 'Vary (Strong)',
        [MidjourneyImagineAction.VARIATION_SUBTLE]: 'Vary (Subtle)',
        [MidjourneyImagineAction.UPSCALE_CREATIVE]: 'Upscale (Creative)',
        [MidjourneyImagineAction.UPSCALE_SUBTLE]: 'Upscale (Subtle)',
        [MidjourneyImagineAction.ZOOM_OUT_2X]: 'Zoom Out 2x',
        [MidjourneyImagineAction.ZOOM_OUT_1_5X]: 'Zoom Out 1.5x',
        [MidjourneyImagineAction.UPSCALE_2X]: 'Upscale 2x',
        [MidjourneyImagineAction.UPSCALE_4X]: 'Upscale 4x',
        [MidjourneyImagineAction.REDO_UPSCALE_2X]: 'Redo Upscale 2x',
        [MidjourneyImagineAction.REDO_UPSCALE_4X]: 'Redo Upscale 4x',
        [MidjourneyImagineAction.REDO_UPSCALE_SUBTLE]: 'Redo Upscale (Subtle)',
        [MidjourneyImagineAction.REDO_UPSCALE_CREATIVE]: 'Redo Upscale (Creative)',
        [MidjourneyImagineAction.SQUARE]: 'Make Square',
        [MidjourneyImagineAction.PAN_LEFT]: '⬅️',
        [MidjourneyImagineAction.PAN_UP]: '⬆️',
        [MidjourneyImagineAction.PAN_DOWN]: '⬇️',
        [MidjourneyImagineAction.PAN_RIGHT]: '➡️',
        [MidjourneyImagineAction.REROLL]: '🔄'
      },
      descriptionMapping: {
        [MidjourneyImagineAction.GENERATE]: this.$t('midjourney.action.generate'),
        [MidjourneyImagineAction.UPSCALE1]: this.$t('midjourney.action.upscale1'),
        [MidjourneyImagineAction.UPSCALE2]: this.$t('midjourney.action.upscale2'),
        [MidjourneyImagineAction.UPSCALE3]: this.$t('midjourney.action.upscale3'),
        [MidjourneyImagineAction.UPSCALE4]: this.$t('midjourney.action.upscale4'),
        [MidjourneyImagineAction.VARIATION1]: this.$t('midjourney.action.variation1'),
        [MidjourneyImagineAction.VARIATION2]: this.$t('midjourney.action.variation2'),
        [MidjourneyImagineAction.VARIATION3]: this.$t('midjourney.action.variation3'),
        [MidjourneyImagineAction.VARIATION4]: this.$t('midjourney.action.variation4'),
        [MidjourneyImagineAction.VARIATION_STRONG]: this.$t('midjourney.action.variation_strong'),
        [MidjourneyImagineAction.VARIATION_SUBTLE]: this.$t('midjourney.action.variation_subtle'),
        [MidjourneyImagineAction.ZOOM_OUT_2X]: this.$t('midjourney.action.zoom_out_2x'),
        [MidjourneyImagineAction.ZOOM_OUT_1_5X]: this.$t('midjourney.action.zoom_out_1_5x'),
        [MidjourneyImagineAction.UPSCALE_2X]: this.$t('midjourney.action.upscale_2x'),
        [MidjourneyImagineAction.UPSCALE_4X]: this.$t('midjourney.action.upscale_4x'),
        [MidjourneyImagineAction.UPSCALE_SUBTLE]: this.$t('midjourney.action.upscale_subtle'),
        [MidjourneyImagineAction.UPSCALE_CREATIVE]: this.$t('midjourney.action.upscale_creative'),
        [MidjourneyImagineAction.REDO_UPSCALE_2X]: this.$t('midjourney.action.redo_upscale_2x'),
        [MidjourneyImagineAction.REDO_UPSCALE_4X]: this.$t('midjourney.action.redo_upscale_4x'),
        [MidjourneyImagineAction.REDO_UPSCALE_SUBTLE]: this.$t('midjourney.action.redo_upscale_subtle'),
        [MidjourneyImagineAction.REDO_UPSCALE_CREATIVE]: this.$t('midjourney.action.redo_upscale_creative'),
        [MidjourneyImagineAction.SQUARE]: this.$t('midjourney.action.square'),
        [MidjourneyImagineAction.PAN_LEFT]: this.$t('midjourney.action.pan_left'),
        [MidjourneyImagineAction.PAN_UP]: this.$t('midjourney.action.pan_up'),
        [MidjourneyImagineAction.PAN_DOWN]: this.$t('midjourney.action.pan_down'),
        [MidjourneyImagineAction.PAN_RIGHT]: this.$t('midjourney.action.pan_right'),
        [MidjourneyImagineAction.REROLL]: this.$t('midjourney.action.reroll')
      }
    };
  },
  computed: {
    application() {
      return this.$store.state.midjourney.application;
    },
    config() {
      return this.$store.state.midjourney?.config;
    },
    service() {
      return this.$store.state.midjourney?.service;
    }
  },
  methods: {
    getActionDescriptionWithPrice(action: string, mode?: string): string {
      // @ts-ignore
      const baseDescription = this.descriptionMapping[action];
      const price = getConsumption({ ...this.config, action: action, mode: mode }, this.service?.cost);
      const unit = this.$t(`service.unit.${this.service?.unit || 'credits'}`);
      return `${baseDescription} (${price} ${unit})`;
    },
    onCustom(action: string) {
      if (this.modelValue?.type === 'imagine') {
        this.$emit('custom', {
          action,
          image_id: this.modelValue?.response?.image_id
        });
      }
    },
    onExtend(_event: MouseEvent, response: IMidjourneyVideosResponse) {
      // extend url here
      console.debug('set config', response);
      this.$store.commit('midjourney/setConfig', {
        ...this.$store.state.midjourney?.config,
        video_id: response.video_id,
        // @ts-ignore
        video_url: response.video_urls?.[0],
        action: 'extend',
        active_tab: 'video',
        is_videos: true
      });
    },
    onDownload(url: string) {
      // download image using javascript
      const link = document.createElement('a');
      link.href = url;
      link.download = url.split('/').pop() as string;
      link.click();
    }
  }
});
</script>

<style lang="scss" scoped>
$left-width: 70px;
.item {
  display: flex;
  flex-direction: row;
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
  .preview {
    flex: 1;
    width: calc(100% - $left-width);
    padding: 10px 10px 0 10px;
    display: flex;
    flex-direction: column;

    .bot {
      font-size: 16px;
      font-weight: bold;
      color: rgb(46, 204, 113);
      margin-bottom: 10px;
      margin-top: 0;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
    }

    .description {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-bottom: 10px;
      text-align: left;
    }

    .info {
      display: flex;
      flex-direction: row;
      width: 100%;

      .prompt {
        font-size: 14px;
        font-weight: bold;
        color: var(--el-text-color-regular);
        margin-bottom: 10px;
      }

      .mode {
        .icon {
          display: inline-block;
          margin-right: 2px;
          &.turbo {
            color: #ff9900;
          }
          &.fast {
            color: #2dc49c;
          }
          &.relax {
            color: #ce65e6;
          }
        }
      }
    }
    .content {
      width: 100%;
      position: relative;
      margin-bottom: 10px;
      &.full {
        height: 220px;
        display: flex;
        align-items: center;
        .image {
          min-height: 200px;
        }
      }
      .progress {
        position: absolute;
        top: 49%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 20px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 5px black;
      }
    }

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

    .operations {
      display: flex;
      justify-content: left;
      flex-direction: row;
      width: 100%;
      align-items: baseline;
      flex-wrap: wrap;
      margin-bottom: 15px;
      overflow: hidden;
      text-align: center;
      color: var(--el-text-color-regular);
      font-size: 14px;
      overflow-y: scroll;
      gap: 10px;

      &.full {
        height: 70px;
      }

      .btn-action {
        margin-left: 0;
      }
    }
  }
}
</style>
