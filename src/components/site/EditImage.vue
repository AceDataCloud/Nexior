<template>
  <el-dialog v-model="editing" :title="title" width="400px" class="edit-dialog">
    <div class="edit-body">
      <div class="cropper-wrapper" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        <image-editor
          ref="cropper"
          class="cropper"
          :width="width"
          :height="height"
          :rotation="rotation"
          :scale="scale"
          @image-ready="onImageReady"
          @select-file="onFileSelected"
        />
        <div v-show="!imageLoaded" class="hint">
          {{ $t('site.message.uploadHint') }}
        </div>
      </div>

      <el-button-group v-show="imageLoaded" class="zoom">
        <el-button type="primary" @click="onZoom(0.1)">
          <el-icon class="icon">
            <zoom-in />
          </el-icon>
        </el-button>
        <el-button type="primary" @click="onZoom(-0.1)">
          <el-icon class="icon">
            <zoom-out />
          </el-icon>
        </el-button>
      </el-button-group>

      <el-button v-show="!imageLoaded" round type="primary" class="btn-upload" @click="onTriggerPicker">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-2" />
        {{ $t('site.button.upload') }}
      </el-button>

      <div class="tip">{{ tip }}</div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" :loading="uploading" :disabled="!imageLoaded" @click="onConfirm">
          {{ $t('common.button.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
  <span class="edit" @click="editing = true">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton, ElIcon, ElMessage, ElButtonGroup } from 'element-plus';
import { Edit, ZoomIn, ZoomOut } from '@element-plus/icons-vue';
import { getBaseUrlPlatform } from '@/utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// @ts-ignore - plain JS Vue component, no types
import ImageEditor from '@/components/common/ImageEditor.vue';

const CROPPER_BORDER = 25;

export default defineComponent({
  name: 'EditImage',
  components: {
    ElDialog,
    ElButton,
    ElButtonGroup,
    FontAwesomeIcon,
    ElIcon,
    Edit,
    ZoomIn,
    ZoomOut,
    ImageEditor
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 200
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      imageLoaded: false,
      scale: 1,
      rotation: 0,
      uploading: false
    };
  },
  computed: {
    canvasWidth(): number {
      return this.width + CROPPER_BORDER * 2;
    },
    canvasHeight(): number {
      return this.height + CROPPER_BORDER * 2;
    }
  },
  watch: {
    editing(val: boolean) {
      // Reset cropper state on every open/close so the next edit starts fresh.
      if (!val) {
        this.scale = 1;
        this.rotation = 0;
        this.imageLoaded = false;
        // @ts-ignore
        this.$refs.cropper?.resetImage?.();
      }
    }
  },
  methods: {
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    onZoom(delta: number) {
      this.scale = Math.max(0.1, +(this.scale + delta).toFixed(2));
    },
    onImageReady() {
      this.imageLoaded = true;
      this.scale = 1;
      this.rotation = 0;
    },
    onFileSelected(files: FileList) {
      if (!files || !files.length) return;
      this.imageLoaded = false;
    },
    onTriggerPicker() {
      // @ts-ignore
      this.$refs.cropper?.$refs?.input?.click?.();
    },
    async onConfirm() {
      // @ts-ignore
      const canvas: HTMLCanvasElement | undefined = this.$refs.cropper?.getImageScaled?.();
      if (!canvas) {
        ElMessage.error(this.$t('site.message.uploadImageError'));
        return;
      }
      this.uploading = true;
      try {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
        if (!blob) {
          ElMessage.error(this.$t('site.message.uploadImageError'));
          return;
        }
        const form = new FormData();
        form.append('file', blob, 'image.png');
        const resp = await fetch(getBaseUrlPlatform() + '/api/v1/files/', {
          method: 'POST',
          body: form,
          headers: {
            Authorization: `Bearer ${this.$store.state.token.access}`
          }
        });
        if (!resp.ok) {
          ElMessage.error(this.$t('site.message.uploadImageError'));
          return;
        }
        const data = (await resp.json()) as { file_url?: string };
        if (!data.file_url) {
          ElMessage.error(this.$t('site.message.uploadImageError'));
          return;
        }
        this.$emit('confirm', data.file_url);
        this.editing = false;
      } catch (e) {
        ElMessage.error(this.$t('site.message.uploadImageError'));
      } finally {
        this.uploading = false;
      }
    }
  }
});
</script>

<style lang="scss">
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
  .icon {
    font-size: 14px;
  }
}

.edit-dialog {
  .el-dialog__header {
    display: flex;
    justify-content: center;
    position: relative;
    padding-right: 48px;
  }

  .el-dialog__title {
    width: 100%;
    text-align: center;
    font-weight: 600;
  }

  .el-dialog__headerbtn {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .cropper-wrapper {
    position: relative;
    margin: auto;
    .cropper {
      display: block;
    }
    .hint {
      position: absolute;
      left: 50%;
      bottom: 8px;
      transform: translateX(-50%);
      pointer-events: none;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      background: rgba(255, 255, 255, 0.85);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  .zoom {
    display: block;
    margin: auto;
    width: fit-content;
  }

  .btn-upload {
    margin: 0 auto;
  }

  .tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
  }
}
</style>
