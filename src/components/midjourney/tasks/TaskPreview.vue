<template>
  <div class="preview">
    <div class="info mb-4">
      <div class="left">
        <el-tag v-if="modelValue?.response?.success === true" type="success">
          {{ $t('midjourney.button.success') }}
        </el-tag>
        <el-tag v-if="modelValue?.response?.success === false" type="danger">
          {{ $t('midjourney.button.failed') }}
        </el-tag>
        <el-tag v-if="!modelValue?.response" type="info">
          {{ $t('midjourney.button.generating') }}
        </el-tag>
      </div>
      <div class="right">
        <el-tag v-if="mode" type="info" class="channel">
          <font-awesome-icon :class="{ icon: true, [mode.name]: true }" :icon="mode.icon" />
          {{ mode?.getDisplayName() }}
        </el-tag>
      </div>
    </div>
    <div class="extra">
      <p v-if="modelValue?.request?.prompt" class="prompt">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
        {{ modelValue?.request?.prompt }}
      </p>
    </div>
    <div v-if="!modelValue?.response" :class="{ content: true, full: !!full }">
      <el-image class="image">
        <template #error>
          <div class="image-slot">{{ $t('midjourney.message.generating') }}</div>
        </template>
      </el-image>
    </div>
    <div
      v-else-if="modelValue?.response.success === false"
      :class="{ content: true, full: full, failed: true, 'p-2': true }"
    >
      <el-alert :closable="false">
        <template #template>
          <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
          {{ $t('midjourney.field.failure') }}
        </template>
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
    <div v-else :class="{ content: true, full: full }">
      <el-image
        v-if="modelValue?.response?.image_url"
        :src="modelValue?.response?.image_url"
        :preview-src-list="[modelValue?.response?.raw_image_url as string]"
        fit="contain"
        class="image"
        :lazy="true"
        @error="onReload($event)"
      />
      <p v-if="modelValue?.response?.progress !== undefined && modelValue?.response?.progress !== 100" class="progress">
        {{ modelValue?.response?.progress }}%
      </p>
    </div>
    <div v-if="modelValue?.response?.actions" :class="{ operations: true, full }">
      <el-tooltip
        v-for="(action, actionKey) in modelValue?.response?.actions"
        :key="actionKey"
        class="box-item"
        effect="dark"
        :content="descriptionMapping[action]"
        placement="top-start"
      >
        <el-button type="info" size="small" class="btn-action" @click="onCustom(action)">
          {{ actionMapping[action] }}
        </el-button>
      </el-tooltip>
    </div>
    <div v-else-if="!modelValue?.response" v-show="full" :class="{ operations: true, full }">
      <el-skeleton :rows="1" />
    </div>
    <div v-else v-show="full" :class="{ operations: true, full }">
      <p>
        {{ $t('midjourney.message.noOperations') }}
      </p>
    </div>
    <div class="extra">
      <p v-if="modelValue?.created_at" class="datetime">
        <font-awesome-icon icon="fa-regular fa-clock" class="mr-1" />
        {{ $dayjs.format('' + new Date(parseFloat(modelValue?.created_at) * 1000)) }}
      </p>
      <p class="description">{{ $t('midjourney.field.taskId') }}: {{ modelValue?.id }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElTag, ElButton, ElTooltip, ElSkeleton, ElAlert } from 'element-plus';
import {
  IMidjourneyImagineTask,
  MidjourneyImagineAction,
  MidjourneyImagineMode,
  MidjourneyImagineState
} from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { MIDJOURNEY_MODE_FAST, MIDJOURNEY_MODE_RELAX, MIDJOURNEY_MODE_TURBO } from '@/constants';

interface IData {
  midjourneyImagineState: typeof MidjourneyImagineState;
  actionMapping: Record<MidjourneyImagineAction, string>;
  descriptionMapping: Record<MidjourneyImagineAction, string>;
}

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ElTag,
    ElButton,
    FontAwesomeIcon,
    ElTooltip,
    ElSkeleton,
    ElAlert,
    CopyToClipboard
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyImagineTask | undefined,
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
    mode() {
      switch (this.modelValue?.mode) {
        case MidjourneyImagineMode.FAST:
          return MIDJOURNEY_MODE_FAST;
        case MidjourneyImagineMode.TURBO:
          return MIDJOURNEY_MODE_TURBO;
        case MidjourneyImagineMode.RELAX:
          return MIDJOURNEY_MODE_RELAX;
        default:
          return undefined;
      }
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
      this.$emit('custom', {
        action,
        image_id: this.modelValue?.response?.image_id
      });
    },
    onDownload(url: string) {
      // download image using javascript
      const link = document.createElement('a');
      link.href = url;
      link.download = url.split('/').pop() as string;
      link.click();
    },
    getModeIcon(mode: MidjourneyImagineMode): string | undefined {
      switch (mode) {
        case MidjourneyImagineMode.FAST:
          return MIDJOURNEY_MODE_FAST.icon;
        case MidjourneyImagineMode.TURBO:
          return MIDJOURNEY_MODE_TURBO.icon;
        case MidjourneyImagineMode.RELAX:
          return MIDJOURNEY_MODE_RELAX.icon;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.preview {
  width: 350px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color);

  .description {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-bottom: 10px;
  }

  .info {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    width: 100%;

    .left {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      flex: 1;
    }

    .right {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      flex: 1;

      .btn {
        cursor: pointer;
      }

      .channel {
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
    &.failed {
      .image {
        .image-slot {
          font-size: 16px;
          padding: 20px;
        }
      }
    }
    .image {
      width: 100%;
      height: 100%;
      min-height: 100px;
      .image-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-regular);
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

  .operations {
    display: flex;
    justify-content: center;
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

  .extra {
    text-align: center;
    .datetime,
    .prompt {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin-bottom: 5px;
    }
  }
}
</style>
