<template>
  <div>
    <div class="mb-[10px] flex min-h-8 w-full items-center justify-between gap-3">
      <div class="flex min-w-0 items-center">
        <h2 class="m-0 text-[14px] font-bold">{{ title }}</h2>
        <info-icon :content="description" />
      </div>
      <el-upload
        ref="uploader"
        v-model:file-list="fileList"
        name="file"
        class="shrink-0"
        :accept="accept"
        :limit="limit"
        :multiple="true"
        :show-file-list="false"
        :before-upload="beforeUploadSizeGuard"
        :action="uploadUrl"
        :headers="headers"
        :on-change="onChange"
        :on-error="onError"
        :on-exceed="onExceed"
        :on-success="onSuccess"
      >
        <el-button size="small" type="primary" round>
          <upload-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('minimax.button.upload') }}
        </el-button>
      </el-upload>
    </div>
    <div v-if="fileList.length" class="flex flex-wrap gap-[10px]">
      <div v-for="(file, index) in fileList" :key="(file as any).uid || uploadedUrl(file) || index" class="relative">
        <image-preview
          v-if="kind === 'image'"
          :url="(file as any).url || uploadedUrl(file)"
          :name="(file as any).name"
          :percentage="(file as any).percentage"
          @remove="removeFile(index, file)"
        />
        <template v-else>
          <audio-preview v-if="uploadedUrl(file)" :url="uploadedUrl(file)!" :name="(file as any).name" />
          <el-progress v-else type="circle" :percentage="(file as any).percentage || 0" :width="50" :stroke-width="3" />
          <button
            type="button"
            class="remove-button"
            :aria-label="$t('common.button.delete')"
            @click="removeFile(index, file)"
          >
            <close-icon :size="'0.75em' as any" aria-hidden="true" focusable="false" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { CloseIcon, UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, PropType } from 'vue';
import { ElButton, ElMessage, ElProgress, ElUpload, UploadFile, UploadFiles } from 'element-plus';
import AudioPreview from '@/components/common/AudioPreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  dropUploadMixin,
  getBaseUrlPlatform,
  pasteUploadMixin,
  uploadSizeGuardMixin,
  uploadTrackerMixin
} from '@/utils';

type MediaKind = 'image' | 'audio';

export default defineComponent({
  name: 'MinimaxReferenceMediaInput',
  components: {
    AudioPreview,
    CloseIcon,
    ElButton,
    ElProgress,
    ElUpload,
    ImagePreview,
    InfoIcon,
    UploadIcon
  },
  mixins: [pasteUploadMixin, dropUploadMixin, uploadTrackerMixin, uploadSizeGuardMixin],
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    kind: {
      type: String as PropType<MediaKind>,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      fileList: [] as UploadFiles,
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    accept(): string {
      return this.kind === 'image'
        ? '.png,.jpg,.jpeg,.gif,.bmp,.webp,image/*'
        : '.mp3,.wav,.m4a,.aac,.ogg,.flac,audio/*';
    },
    pasteAccept(): string {
      return this.accept;
    },
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    }
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(urls: string[]) {
        const uploading = this.fileList.filter((file) => !this.uploadedUrl(file));
        const completed = urls.map((url) => {
          const existing = this.fileList.find((file) => this.uploadedUrl(file) === url);
          return (
            existing ||
            ({
              name: url.split('/').pop() || url,
              url,
              status: 'success',
              percentage: 100,
              response: { file_url: url }
            } as UploadFile)
          );
        });
        this.fileList = [...completed, ...uploading];
      }
    }
  },
  methods: {
    uploadedUrl(file: UploadFile): string | undefined {
      return (file.response as any)?.file_url;
    },
    onChange(file: UploadFile) {
      if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw);
    },
    onError() {
      ElMessage.error(this.$t('minimax.message.uploadError'));
    },
    onExceed() {
      ElMessage.warning(this.$t(`minimax.message.${this.kind}Limit`));
    },
    onSuccess(response: any, file: UploadFile) {
      if (response?.file_url) {
        if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url);
        file.url = response.file_url;
        file.response = response;
      }
      this.emitUrls();
    },
    removeFile(index: number, file: UploadFile) {
      this.fileList.splice(index, 1);
      if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url);
      this.emitUrls();
    },
    emitUrls() {
      this.$emit(
        'update:modelValue',
        this.fileList.map((file) => this.uploadedUrl(file)).filter((url): url is string => Boolean(url))
      );
    }
  }
});
</script>

<style scoped>
.remove-button {
  position: absolute;
  top: -5px;
  right: -5px;
  display: flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: white;
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  cursor: pointer;
}
</style>
