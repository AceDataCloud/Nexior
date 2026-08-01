<template>
  <el-upload
    ref="uploader"
    v-model:file-list="fileList"
    :accept="accept"
    name="file"
    class="media-input"
    :limit="1"
    :multiple="false"
    :before-upload="beforeUploadSizeGuard"
    :action="uploadUrl"
    :headers="headers"
    :on-exceed="onExceed"
    :on-error="onError"
    :on-success="onChange"
    :on-remove="onChange"
  >
    <template #file="{ file }">
      <div class="slot" :class="{ pending: isPending(file) }">
        <image-preview
          v-if="kind === 'image' && file.url"
          :url="file.url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="onRemoveFile(file)"
        />
        <template v-else>
          <div class="thumb">
            <video-preview v-if="kind === 'video' && uploadedUrl(file)" :url="uploadedUrl(file)!" />
            <audio-preview v-else-if="kind === 'audio' && uploadedUrl(file)" :url="uploadedUrl(file)!" />
            <div v-else class="placeholder">
              <el-progress
                v-if="isPending(file)"
                type="circle"
                :stroke-width="4"
                :percentage="Math.round(file.percentage || 0)"
                :width="34"
              />
              <video-icon v-else-if="kind === 'video'" :size="'1em' as any" aria-hidden="true" focusable="false" />
              <music-icon v-else :size="'1em' as any" aria-hidden="true" focusable="false" />
            </div>
          </div>
          <span class="filename" :title="file.name">{{ file.name }}</span>
          <button
            type="button"
            class="remove"
            :aria-label="$t('common.button.close')"
            :title="$t('common.button.close')"
            @click.stop="onRemoveFile(file)"
          >
            <close-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </template>
      </div>
    </template>

    <el-button round type="primary" size="small" class="btn">
      <upload-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
      {{ hasFile ? $t('digitalhuman.button.replace') : buttonText }}
    </el-button>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </el-upload>
</template>

<script lang="ts">
import { CloseIcon, MusicIcon, UploadIcon, VideoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElMessage, ElProgress, ElUpload, UploadFile, UploadFiles, UploadInstance } from 'element-plus';
import AudioPreview from '@/components/common/AudioPreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import VideoPreview from '@/components/common/VideoPreview.vue';
import {
  dropUploadMixin,
  getBaseUrlPlatform,
  pasteUploadMixin,
  uploadSizeGuardMixin,
  uploadTrackerMixin
} from '@/utils';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'DigitalHumanMediaInput',
  components: {
    AudioPreview,
    CloseIcon,
    ElButton,
    ElProgress,
    ElUpload,
    ImagePreview,
    MusicIcon,
    UploadIcon,
    VideoIcon,
    VideoPreview
  },
  mixins: [pasteUploadMixin, dropUploadMixin, uploadTrackerMixin, uploadSizeGuardMixin],
  props: {
    kind: {
      type: String as PropType<'image' | 'video' | 'audio'>,
      required: true
    },
    accept: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    }
  },
  emits: ['change'],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    hasFile(): boolean {
      return this.fileList.length > 0;
    }
  },
  methods: {
    /** The CDN url the platform hands back once the upload lands. */
    uploadedUrl(file: UploadFile): string | undefined {
      return (file?.response as { file_url?: string } | undefined)?.file_url;
    },
    isPending(file: UploadFile): boolean {
      return file.status === 'ready' || file.status === 'uploading';
    },
    onExceed(files: File[]) {
      // Single-file slot: a newly picked file replaces whatever is there.
      const uploader = this.$refs.uploader as UploadInstance | undefined;
      uploader?.clearFiles();
      const file = files[0];
      if (file) {
        (uploader as any)?.handleStart?.(file);
        (uploader as any)?.submit?.();
      }
    },
    onError() {
      ElMessage.error(this.$t('digitalhuman.message.uploadError'));
    },
    onRemoveFile(file: UploadFile) {
      const index = this.fileList.indexOf(file);
      if (index >= 0) {
        this.fileList.splice(index, 1);
      }
      this.onChange();
    },
    onChange() {
      const file = this.fileList?.[0] as UploadFile | undefined;
      this.$emit('change', file ? this.uploadedUrl(file) : undefined);
    }
  }
});
</script>

<style lang="scss" scoped>
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.slot {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-fill-color-lighter);

  .thumb {
    flex: none;
  }

  .placeholder {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--el-border-radius-base);
    background-color: var(--el-fill-color-dark);
    color: var(--el-text-color-secondary);
  }

  .filename {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: var(--el-text-color-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove {
    flex: none;
    padding: 4px 6px;
    border: none;
    background: transparent;
    line-height: 1;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    &:hover {
      color: var(--el-color-danger);
    }
  }
}
</style>

<style lang="scss">
.media-input {
  display: flex;
  flex-direction: column-reverse;
  height: auto;

  .el-upload-list {
    margin: 0 0 8px;
    width: 100%;
  }

  .el-upload-list__item {
    margin: 0;
    transition: none;
    &:first-child {
      margin-top: 0;
    }
  }
}
</style>
