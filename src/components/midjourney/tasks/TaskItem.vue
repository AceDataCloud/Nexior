<template>
  <div v-if="modelValue?.type === 'imagine'" class="item">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/05daz4.png" class="avatar" />
    </div>
    <div class="preview">
      <div class="bot">
        {{ $t('midjourney.name.midjourneyBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat(modelValue?.created_at || '') * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span v-if="modelValue?.response?.progress !== undefined && modelValue?.response?.progress !== 100">
            - ({{ modelValue?.response?.progress }}%)
          </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
        <p v-if="modelValue?.request?.image_id" class="prompt mt-2">
          {{ modelValue?.request?.image_id }} - {{ modelValue?.request?.action }}
          <span v-if="!modelValue?.response"> - ({{ $t('midjourney.status.pending') }}) </span>
          <span>({{ modelValue?.request?.mode }})</span>
        </p>
      </div>
      <!-- response error -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true, full: full, failed: true }">
        <el-alert :closable="false" class="failure">
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('midjourney.field.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('midjourney.field.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <!-- response success -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, full: full }">
        <div class="image-wrapper">
          <img
            v-if="modelValue?.response?.image_url"
            :src="modelValue?.response?.image_url"
            :preview-src-list="[modelValue?.response?.raw_image_url as string]"
            class="image"
            @error="onReload($event)"
          />
          <el-button
            v-if="modelValue?.response?.image_url"
            type="info"
            round
            class="btn-raw"
            @click="onOpenUrl(modelValue?.response?.raw_image_url)"
          >
            {{ $t('common.button.seeRawImage') }}
          </el-button>
        </div>
        <div v-if="modelValue?.response?.actions" :class="{ operations: true, full, 'mt-2': true }">
          <el-tooltip
            v-for="(action, actionKey) in modelValue?.response?.actions"
            :key="actionKey"
            class="box-item"
            effect="dark"
            :content="descriptionMapping[action]"
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
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-image" class="mr-1" />
            {{ $t('midjourney.field.imageId') }}:
            {{ modelValue?.response?.image_id }}
            <copy-to-clipboard :content="modelValue?.response?.image_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <!-- response pending -->
      <div v-if="!modelValue?.response">
        <el-alert :closable="false" class="mt-2 info">
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('midjourney.field.taskId') }}:
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
import { ElImage, ElButton, ElTooltip, ElAlert } from 'element-plus';
import { IMidjourneyTask, MidjourneyImagineAction, MidjourneyImagineState } from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

interface IData {
  midjourneyImagineState: typeof MidjourneyImagineState;
  actionMapping: Record<MidjourneyImagineAction, string>;
  descriptionMapping: Record<MidjourneyImagineAction, string>;
}

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ElButton,
    FontAwesomeIcon,
    ElTooltip,
    ElAlert,
    CopyToClipboard
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
    }
  },
  methods: {
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
    onCustom(action: string) {
      if (this.modelValue?.type === 'imagine') {
        this.$emit('custom', {
          action,
          image_id: this.modelValue?.response?.image_id
        });
      }
    },
    onOpenUrl(url: string) {
      window.open(url, '_blank');
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
      background-color: white;
      padding: 8px;
      width: 50px;
      height: 50px;
      margin: 10px;
      border-radius: 50%;
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
      margin-bottom: 0;
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
      .image-wrapper {
        position: relative;
        width: fit-content;
        min-height: 50px;
        min-width: 100px;
        .image {
          max-height: 400px;
          max-width: 300px;
        }
        .btn-raw {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          display: none;
        }
        &:hover {
          .image {
            filter: brightness(0.6);
          }
          .btn-raw {
            display: block;
          }
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
