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
        <el-tag v-if="channel" type="info" class="channel">
          <font-awesome-icon :class="{ icon: true, [channel.name]: true }" :icon="channel?.icon" />
          {{ channel?.displayName }}
        </el-tag>
      </div>
    </div>
    <div v-if="!full" class="extra">
      <p v-if="modelValue?.request?.prompt" class="prompt">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
        {{ modelValue?.request?.prompt }}
      </p>
    </div>
    <p v-show="false" class="description">{{ $t('midjourney.field.taskId') }}: {{ modelValue?.id }}</p>
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
          {{ modelValue?.response?.detail }}
          <copy-to-clipboard :content="modelValue?.response?.detail!" class="btn-copy" />
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
      <p class="datetime">
        <font-awesome-icon icon="fa-regular fa-clock" class="mr-1" />
        {{ $dayjs.format(modelValue?.created_at) }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElTag, ElButton, ElTooltip, ElSkeleton, ElAlert } from 'element-plus';
import { IApplication, IMidjourneyImagineTask, MidjourneyImagineAction, MidjourneyImagineState } from '@/operators';
import {
  API_ID_MIDJOURNEY_FAST,
  API_ID_MIDJOURNEY_RELAX,
  API_ID_MIDJOURNEY_TURBO,
  MIDJOURNEY_CHANNEL_FAST,
  MIDJOURNEY_CHANNEL_RELAX,
  MIDJOURNEY_CHANNEL_TURBO
} from '@/operators/midjourney/constants';
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
    applications: {
      type: Object as () => IApplication[],
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
        [MidjourneyImagineAction.UPSAMPLE1]: 'U1',
        [MidjourneyImagineAction.UPSAMPLE2]: 'U2',
        [MidjourneyImagineAction.UPSAMPLE3]: 'U3',
        [MidjourneyImagineAction.UPSAMPLE4]: 'U4',
        [MidjourneyImagineAction.VARIATION1]: 'V1',
        [MidjourneyImagineAction.VARIATION2]: 'V2',
        [MidjourneyImagineAction.VARIATION3]: 'V3',
        [MidjourneyImagineAction.VARIATION4]: 'V4',
        [MidjourneyImagineAction.HIGH_VARIATION]: 'Vary (Strong)',
        [MidjourneyImagineAction.LOW_VARIATION]: 'Vary (Subtle)',
        [MidjourneyImagineAction.ZOOM_OUT_2X]: 'Zoom Out 2x',
        [MidjourneyImagineAction.ZOOM_OUT_1_5X]: 'Zoom Out 1.5x',
        [MidjourneyImagineAction.UPSAMPLE_2X]: 'Upsample 2x',
        [MidjourneyImagineAction.UPSAMPLE_4X]: 'Upsample 4x',
        [MidjourneyImagineAction.REDO_UPSAMPLE_2X]: 'Redo Upsample 2x',
        [MidjourneyImagineAction.REDO_UPSAMPLE_4X]: 'Redo Upsample 4x',
        [MidjourneyImagineAction.SQUARE]: 'Make Square',
        [MidjourneyImagineAction.PAN_LEFT]: '⬅️',
        [MidjourneyImagineAction.PAN_UP]: '⬆️',
        [MidjourneyImagineAction.PAN_DOWN]: '⬇️',
        [MidjourneyImagineAction.PAN_RIGHT]: '➡️',
        [MidjourneyImagineAction.REROLL]: '🔄'
      },
      descriptionMapping: {
        [MidjourneyImagineAction.GENERATE]: this.$t('midjourney.description.generate'),
        [MidjourneyImagineAction.UPSAMPLE1]: this.$t('midjourney.description.upsample1'),
        [MidjourneyImagineAction.UPSAMPLE2]: this.$t('midjourney.description.upsample2'),
        [MidjourneyImagineAction.UPSAMPLE3]: this.$t('midjourney.description.upsample3'),
        [MidjourneyImagineAction.UPSAMPLE4]: this.$t('midjourney.description.upsample4'),
        [MidjourneyImagineAction.VARIATION1]: this.$t('midjourney.description.variation1'),
        [MidjourneyImagineAction.VARIATION2]: this.$t('midjourney.description.variation2'),
        [MidjourneyImagineAction.VARIATION3]: this.$t('midjourney.description.variation3'),
        [MidjourneyImagineAction.VARIATION4]: this.$t('midjourney.description.variation4'),
        [MidjourneyImagineAction.HIGH_VARIATION]: this.$t('midjourney.description.high_variation'),
        [MidjourneyImagineAction.LOW_VARIATION]: this.$t('midjourney.description.low_variation'),
        [MidjourneyImagineAction.ZOOM_OUT_2X]: this.$t('midjourney.description.zoom_out_2x'),
        [MidjourneyImagineAction.ZOOM_OUT_1_5X]: this.$t('midjourney.description.zoom_out_1_5x'),
        [MidjourneyImagineAction.UPSAMPLE_2X]: this.$t('midjourney.description.upsample_2x'),
        [MidjourneyImagineAction.UPSAMPLE_4X]: this.$t('midjourney.description.upsample_4x'),
        [MidjourneyImagineAction.REDO_UPSAMPLE_2X]: this.$t('midjourney.description.redo_upsample_2x'),
        [MidjourneyImagineAction.REDO_UPSAMPLE_4X]: this.$t('midjourney.description.redo_upsample_4x'),
        [MidjourneyImagineAction.SQUARE]: this.$t('midjourney.description.square'),
        [MidjourneyImagineAction.PAN_LEFT]: this.$t('midjourney.description.pan_left'),
        [MidjourneyImagineAction.PAN_UP]: this.$t('midjourney.description.pan_up'),
        [MidjourneyImagineAction.PAN_DOWN]: this.$t('midjourney.description.pan_down'),
        [MidjourneyImagineAction.PAN_RIGHT]: this.$t('midjourney.description.pan_right'),
        [MidjourneyImagineAction.REROLL]: this.$t('midjourney.description.reroll')
      }
    };
  },
  computed: {
    application() {
      return this.applications?.find((application) => {
        return application.id === this.modelValue?.request?.application_id;
      });
    },
    channel() {
      if (this.application?.api_id === API_ID_MIDJOURNEY_FAST) {
        return MIDJOURNEY_CHANNEL_FAST;
      } else if (this.application?.api_id === API_ID_MIDJOURNEY_RELAX) {
        return MIDJOURNEY_CHANNEL_RELAX;
      } else if (this.application?.api_id === API_ID_MIDJOURNEY_TURBO) {
        return MIDJOURNEY_CHANNEL_TURBO;
      }
      return undefined;
    }
  },
  methods: {
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
    color: #666;
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
        color: var(--el-text-color-secondary);
        // font-size: 30px;
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
    color: #666;
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
      color: #666;
      margin-bottom: 5px;
    }
  }
}
</style>
