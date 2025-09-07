<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('nanobanana.name.imageUrls') }}</h2>
    <div class="upload-wrapper">
      <el-upload
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value upload-wrapper"
        :limit="5"
        :multiple="true"
        list-type="picture"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <template #file="{ file }">
          <image-preview
            :url="file.url || (file.response as any)?.file_url"
            :name="file.name"
            :percentage="file.percentage"
            @remove="fileList.splice(fileList.indexOf(file), 1)"
          />
        </template>
        <div class="controls">
          <el-button size="small" type="primary" round>
            <font-awesome-icon icon="fa-solid fa-upload" class="mr-1" />
            {{ $t('nanobanana.button.uploadImageUrls') }}
          </el-button>
          <info-icon :content="$t('nanobanana.description.imageUrls')" class="ml-2" />
        </div>
      </el-upload>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
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

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .title {
    font-size: 14px;
    margin: 0 0 10px 0;
    width: 100%;
  }
  .value {
    width: 100%;
    margin: 0;
  }
  .upload-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .info {
    margin-left: auto;
  }
}
</style>
