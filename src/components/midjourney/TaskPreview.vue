<template>
  <div class="preview">
    <div class="info mb-4">
      <div class="left">
        <el-tag v-if="modelValue?.response?.success === true" type="success">成功</el-tag>
        <el-tag v-if="modelValue?.response?.success === false" type="danger">失败</el-tag>
      </div>
      <div class="right"></div>
    </div>
    <div v-if="modelValue?.state === midjourneyImagineState.PENDING" class="content">
      <p>图像生成中...</p>
    </div>
    <div v-else class="content">
      <el-image
        v-if="modelValue?.response?.image_url"
        :src="modelValue?.response?.image_url"
        fit="fill"
        class="image"
      />
      <p v-if="modelValue?.response?.progress !== undefined && modelValue?.response?.progress !== 100" class="progress">
        {{ modelValue?.response?.progress }}%
      </p>
    </div>
    <div class="operations">
      <el-button
        v-for="(action, actionKey) in modelValue?.response?.actions"
        :key="actionKey"
        type="info"
        size="small"
        class="btn-action"
        @click="onCustom(action)"
      >
        {{ actionMapping[action] }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElTag, ElButton } from 'element-plus';
import { IMidjourneyImagineTask, MidjourneyImagineAction, MidjourneyImagineState } from '@/operators';

interface IData {
  midjourneyImagineState: typeof MidjourneyImagineState;
  actionMapping: Record<MidjourneyImagineAction, string>;
}

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    ElTag,
    ElButton
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyImagineTask | undefined,
      required: true
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
        [MidjourneyImagineAction.SQUARE]: 'Make Square',
        [MidjourneyImagineAction.PAN_LEFT]: '⬅️',
        [MidjourneyImagineAction.PAN_UP]: '⬆️',
        [MidjourneyImagineAction.PAN_DOWN]: '⬇️',
        [MidjourneyImagineAction.PAN_RIGHT]: '➡️',
        [MidjourneyImagineAction.REROLL]: '🔄'
      }
    };
  },
  methods: {
    onCustom(action: string) {
      this.$emit('custom', {
        action,
        image_id: this.modelValue?.response?.image_id
      });
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

  .info {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    width: 100%;
  }
  .content {
    width: 100%;
    position: relative;
    margin-bottom: 10px;
    .image {
      width: 100%;
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

    .btn-action {
      margin-bottom: 10px;
    }
  }
}
</style>
