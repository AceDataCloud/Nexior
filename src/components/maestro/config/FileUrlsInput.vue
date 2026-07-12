<template>
  <div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      :accept="MAESTRO_FILE_ACCEPT"
      name="file"
      class="w-full"
      :limit="MAESTRO_FILE_LIMIT"
      :multiple="true"
      :show-file-list="false"
      :action="uploadUrl"
      :headers="headers"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-change="onFileChange"
      :on-success="onSuccess"
    >
      <el-button type="primary" size="small" round>
        <font-awesome-icon icon="fa-solid fa-paperclip" class="mr-1" />
        {{ $t('maestro.button.uploadFiles') }}
      </el-button>
    </el-upload>
    <div v-if="fileList.length" class="mt-[10px] flex flex-wrap gap-[10px]">
      <template v-for="(file, index) in fileList" :key="file.uid">
        <image-preview
          v-if="isImageFile(file)"
          :url="getFileUrl(file)"
          :name="file.name"
          :percentage="file.percentage"
          @remove="onRemovePreview(index, file)"
        />
        <file-preview
          v-else
          class="max-w-full"
          :title="file.name"
          :name="file.name"
          :percentage="file.percentage"
          @remove="onRemovePreview(index, file)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile, UploadInstance } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, isImageUrl } from '@/utils';
import { MAESTRO_FILE_ACCEPT, MAESTRO_FILE_LIMIT } from '@/constants';
import FilePreview from '@/components/common/FilePreview.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  MAESTRO_FILE_ACCEPT: string;
  MAESTRO_FILE_LIMIT: number;
}

export default defineComponent({
  name: 'MaestroFileUrlsInput',
  components: {
    ElUpload,
    ElButton,
    FilePreview,
    ImagePreview,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      MAESTRO_FILE_ACCEPT,
      MAESTRO_FILE_LIMIT
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    }
  },
  beforeUnmount() {
    this.fileList.forEach(this.revokeObjectUrl);
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('maestro.message.uploadExceed'));
    },
    onError(_error: Error, file: UploadFile) {
      this.revokeObjectUrl(file);
      this.syncFileUrls();
      ElMessage.error(this.$t('maestro.message.uploadError'));
    },
    onFileChange(file: UploadFile) {
      if (file.status === 'ready' && !file.url && file.raw && this.isImageFile(file)) {
        file.url = URL.createObjectURL(file.raw);
      }
    },
    onSuccess(response: any, file: UploadFile) {
      this.revokeObjectUrl(file);
      if (!response?.file_url) {
        const index = this.fileList.indexOf(file);
        if (index >= 0) {
          this.fileList.splice(index, 1);
        }
        this.syncFileUrls();
        ElMessage.error(this.$t('maestro.message.uploadError'));
        return;
      }
      file.url = response.file_url;
      file.response = response;
      this.syncFileUrls();
    },
    onRemovePreview(index: number, file: UploadFile) {
      const uploader = this.$refs.uploader as UploadInstance | undefined;
      uploader?.abort?.(file);
      this.revokeObjectUrl(file);
      this.fileList.splice(index, 1);
      this.syncFileUrls();
    },
    isImageFile(file: UploadFile): boolean {
      return file.raw?.type.startsWith('image/') || isImageUrl(file.name);
    },
    getFileUrl(file: UploadFile): string {
      return file.url || ((file.response as any)?.file_url as string | undefined) || '';
    },
    revokeObjectUrl(file: UploadFile) {
      if (file.url?.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    },
    syncFileUrls() {
      const urls = this.fileList
        .map((file: UploadFile) => (file?.response as any)?.file_url)
        .filter((url: string | undefined): url is string => !!url);
      this.$store.commit('maestro/setConfig', {
        ...this.$store.state.maestro?.config,
        file_urls: urls
      });
    }
  }
});
</script>
