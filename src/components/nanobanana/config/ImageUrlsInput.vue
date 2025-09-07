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
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => {
        return file?.response?.file_url;
      });
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
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetImageUrls();
  },
  methods: {
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
    async onSuccess() {
      this.onSetImageUrls();
    }
  }
});
</script>

