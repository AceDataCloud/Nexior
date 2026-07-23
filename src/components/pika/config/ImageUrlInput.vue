<template>
  <div>
    <div class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('pika.name.imageUrl') }}</h2>
        <info-icon :content="$t('pika.description.imageUrl')" class="info" />
      </div>
      <el-upload
        ref="uploader"
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value shrink-0"
        :limit="3"
        :multiple="true"
        :show-file-list="false"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-change="onChange"
        :on-remove="onRemove"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button size="small" type="primary" round>
          <upload-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('pika.button.uploadImageUrl') }}
        </el-button>
      </el-upload>
    </div>
    <div v-if="fileList.length" class="file-list mt-2 flex flex-wrap gap-[10px]">
      <image-preview
        v-for="(file, index) in fileList"
        :key="file.uid || file.url || index"
        :url="file.url || (file.response as any)?.file_url"
        :name="file.name"
        :percentage="file.percentage"
        @remove="onRemovePreview(file)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFile, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform, pasteUploadMixin, dropUploadMixin, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
export const DEFAULT_CONTENT = '';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  suppressWatch: boolean;
}

export default defineComponent({
  name: 'ImageUrlInput',
  components: {
    UploadIcon,
    ElUpload,
    ElButton,
    InfoIcon,
    ImagePreview
  },
  mixins: [pasteUploadMixin, dropUploadMixin, uploadTrackerMixin],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      suppressWatch: false
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      return this.fileList
        .map((file: UploadFile) => (file.response as { file_url?: string } | undefined)?.file_url)
        .filter((url): url is string => Boolean(url));
    },
    value(): string[] | undefined {
      return this.$store.state.pika?.config?.image_url;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(value?: string[]) {
        if (this.suppressWatch) return;
        const uploading = this.fileList.filter((file) => !(file.response as any)?.file_url);
        const restored = (value || []).map((url) => {
          const existing = this.fileList.find((file) => (file.response as any)?.file_url === url || file.url === url);
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
        this.fileList = [...restored, ...uploading.filter((file) => !restored.includes(file))];
      }
    }
  },
  methods: {
    onChange(file: UploadFile) {
      if (!file.url && file.raw) file.url = URL.createObjectURL(file.raw);
    },
    onExceed() {
      ElMessage.warning(this.$t('pika.message.uploadStartImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('pika.message.uploadStartImageError'));
    },
    onRemove() {
      this.onSetStartImageUrl();
    },
    onSetStartImageUrl() {
      this.suppressWatch = true;
      this.$store.commit('pika/setConfig', {
        ...this.$store.state.pika?.config,
        image_url: this.urls
      });
      this.$nextTick(() => {
        this.suppressWatch = false;
      });
    },
    onSuccess() {
      this.onSetStartImageUrl();
    },
    onRemovePreview(file: UploadFiles[number]) {
      const index = this.fileList.indexOf(file);
      if (index >= 0) this.fileList.splice(index, 1);
      if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url);
      this.onSetStartImageUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  min-height: 32px;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .label {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .info {
    flex: none;
  }

  .title {
    min-width: 0;
    margin: 0;
    font-size: 14px;
  }

  .value {
    flex: none;
  }
}
</style>
