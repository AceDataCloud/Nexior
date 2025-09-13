<template>
  <div class="field flex items-center justify-between">
    <h2 class="title font-bold text-[14px] mb-[10px]">{{ $t('nanobanana.name.imageUrls') }}</h2>
    <div class="upload-wrapper flex flex-col items-start gap-[8px]">
      <div class="controls flex items-center">
        <el-upload
          v-model:file-list="fileList"
          accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
          name="file"
          class="value"
          :limit="5"
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
            {{ $t('nanobanana.button.uploadImageUrls') }}
          </el-button>
        </el-upload>
        <info-icon :content="$t('nanobanana.description.imageUrls')" class="ml-2" />
      </div>
    </div>
  </div>
  <div class="file-list flex flex-wrap gap-[10px]">
    <image-preview
      v-for="(file, idx) in fileList"
      :key="idx"
      :url="(file as any).url || (file as any)?.response?.file_url"
      :name="(file as any).name"
      :percentage="(file as any).percentage"
      @remove="fileList.splice(idx, 1)"
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
}

export default defineComponent({
  name: 'ImageUrlsInput',
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
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      // only persist uploaded remote URLs for request payload
      // @ts-ignore
      return this.fileList
        // @ts-ignore
        .map((file: UploadFile) => file?.response?.file_url)
        .filter((u: string | undefined) => !!u) as string[];
    },
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.image_urls;
      },
      set() {
        const urls = this.urls;
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
          image_urls: urls
        });
      }
    }
  },
  watch: {
    value: {
      handler(val: string[] | undefined) {
        // sync UI previews when config.image_urls changes (e.g., from Edit button)
        if (!val || !Array.isArray(val)) {
          this.fileList = [] as any;
          return;
        }
        const next = val.map((url: string, idx: number) => ({
          name: url?.split('/')?.pop() || `image_${idx + 1}`,
          url,
          status: 'success',
          percentage: 100
        })) as any;
        this.fileList = next;
      },
      immediate: true,
      deep: false
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetImageUrls();
  },
  methods: {
    onChange(file: any) {
      // ensure preview shows while uploading
      if (!file?.url && file?.raw) {
        try {
          // attach object url for preview
          file.url = URL.createObjectURL(file.raw);
        } catch (e) {
          // ignore
        }
      }
    },
    onRemove(file: any) {
      // revoke object URL to avoid leaks
      if (file?.url && typeof file.url === 'string' && file.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(file.url);
        } catch (e) {
          // ignore
        }
      }
    },
    onExceed() {
      ElMessage.warning(this.$t('nanobanana.message.uploadImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('nanobanana.message.uploadImageError'));
    },
    onSetImageUrls() {
      const urls = this.urls;
      this.$store.commit('nanobanana/setConfig', {
        ...this.$store.state.nanobanana?.config,
        image_urls: urls
      });
    },
    async onSuccess(response: any, file: any) {
      // update preview to remote URL when finished
      if (response?.file_url) {
        file.url = response.file_url;
      }
      this.onSetImageUrls();
    }
  }
});
</script>
