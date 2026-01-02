<template>
  <div class="field flex items-center justify-between">
    <h2 class="title font-bold text-[14px] mb-[10px]">{{ $t('seedream.name.imageUrls') }}</h2>
    <div class="upload-wrapper flex flex-col items-start gap-[8px]">
      <div class="controls flex items-center">
        <el-upload
          v-model:file-list="fileList"
          accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
          name="file"
          class="value"
          :limit="14"
          :multiple="true"
          :show-file-list="false"
          :action="uploadUrl"
          :on-exceed="onExceed"
          :on-error="onError"
          :on-success="onSuccess"
          :on-change="onChange"
          :on-remove="onRemove"
          :headers="headers"
        >
          <el-button size="small" type="primary" round>
            <font-awesome-icon icon="fa-solid fa-upload" class="mr-1" />
            {{ $t('seedream.button.uploadImageUrls') }}
          </el-button>
        </el-upload>
        <info-icon :content="$t('seedream.description.imageUrls')" class="ml-2" />
      </div>
    </div>
  </div>
  <div class="file-list flex flex-wrap gap-[10px]">
    <image-preview
      v-for="(file, idx) in fileList"
      :key="(file as any).uid || (file as any)?.response?.file_url || (file as any).url || idx"
      :url="(file as any).url || (file as any)?.response?.file_url"
      :name="(file as any).name"
      :percentage="(file as any).percentage"
      @remove="onRemovePreview(idx, file)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  suppressWatch: boolean;
}

export default defineComponent({
  name: 'SeedreamImageInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    ImagePreview,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      // @ts-ignore
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
      // @ts-ignore
      return (
        this.fileList
          // @ts-ignore
          .map((file: UploadFile) => file?.response?.file_url)
          .filter((u: string | undefined) => !!u) as string[]
      );
    },
    value(): string[] | undefined {
      return this.$store.state.seedream?.config?.image;
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(newVal?: string[]) {
        if (this.suppressWatch) return;
        if (!newVal || newVal.length === 0) {
          const uploading = (this.fileList || []).filter((f: any) => !f?.response?.file_url);
          this.fileList = uploading.length ? uploading : [];
          return;
        }
        const newFiles: UploadFiles = [];
        newVal.forEach((url: string) => {
          const existing = this.fileList.find(
            (file) => (file as any)?.response?.file_url === url || (file as any)?.url === url
          );
          if (existing) {
            newFiles.push(existing);
          } else {
            newFiles.push({
              name: url.split('/').pop() || url,
              url: url,
              status: 'success',
              percentage: 100,
              response: { file_url: url }
            } as UploadFile);
          }
        });
        const uploading = (this.fileList || []).filter((f: any) => !f?.response?.file_url);
        uploading.forEach((f: any) => {
          const exists = newFiles.some(
            (nf: any) => nf === f || nf?.url === f?.url || nf?.response?.file_url === f?.response?.file_url
          );
          if (!exists) newFiles.push(f);
        });
        this.fileList = newFiles;
      }
    }
  },
  methods: {
    onChange(file: any) {
      if (!file?.url && file?.raw) {
        try {
          file.url = URL.createObjectURL(file.raw);
        } catch (e) {
          // ignore
        }
      }
    },
    onRemove(file: any) {
      if (file?.url && typeof file.url === 'string' && file.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(file.url);
        } catch (e) {
          // ignore
        }
      }
      this.onSetImages();
    },
    onExceed() {
      ElMessage.warning(this.$t('seedream.message.uploadImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('seedream.message.uploadImageError'));
    },
    onSetImages() {
      const urls = this.urls;
      this.suppressWatch = true;
      this.$store.commit('seedream/setConfig', {
        ...this.$store.state.seedream?.config,
        image: urls
      });
      this.$nextTick(() => {
        this.suppressWatch = false;
      });
    },
    async onSuccess(response: any, file: any) {
      if (response?.file_url) {
        file.url = response.file_url;
        file.response = response;
      }
      this.onSetImages();
    },
    onRemovePreview(idx: number, file: any) {
      this.fileList.splice(idx, 1);
      if (file?.url && typeof file.url === 'string' && file.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(file.url);
        } catch (e) {
          // ignore
        }
      }
      this.onSetImages();
    }
  }
});
</script>

