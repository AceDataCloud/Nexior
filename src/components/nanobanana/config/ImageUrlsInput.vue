<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('nanobanana.name.imageUrls') }}</h2>
    <div class="upload-wrapper">
      <el-upload
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value"
        :show-file-list="true"
        :limit="5"
        :multiple="true"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button size="small" type="primary" round>{{ $t('nanobanana.button.uploadImageUrls') }}</el-button>
      </el-upload>
    </div>
    <info-icon :content="$t('nanobanana.description.imageUrls')" class="info" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'ImageUrlsInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon
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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
    margin-left: 60px;
  }
  .upload-wrapper {
    transform: translate(-26px, 5px);
  }
  .info {
    margin-left: auto;
  }
}
</style>
