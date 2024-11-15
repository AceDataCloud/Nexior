<template>
  <div class="field">
    <h2 class="title">{{ $t('headshots.name.endImageUrls') }}</h2>
    <div class="upload-wrapper">
      <el-upload
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value"
        :show-file-list="true"
        :limit="2"
        :multiple="true"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button size="small" type="primary" round>{{ $t('headshots.button.uploadImageUrls') }}</el-button>
      </el-upload>
    </div>
    <info-icon :content="$t('headshots.description.endImageUrls')" class="info" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
export const DEFAULT_CONTENT = '';

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
        const url = file?.response?.file_url;
        return url.replace('https://cdn.acedata.cloud', 'https://acedata-cdn.zhishuyun.com');
      });
    },
    value: {
      get() {
        return this.$store.state.headshots?.config?.image_urls;
      },
      set(val: string) {
        const url = this.urls;
        this.$store.commit('headshots/setConfig', {
          ...this.$store.state.headshots?.config,
          image_urls: url
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
      ElMessage.warning(this.$t('headshots.message.uploadImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('headshots.message.uploadImageError'));
    },
    onSetImageUrls() {
      const urls = this.urls;
      this.$store.commit('headshots/setConfig', {
        ...this.$store.state.headshots?.config,
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
  justify-content: space-between; // Distribute space evenly
  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
    margin-left: 60px; // Adjust this value as needed
  }
  .upload-wrapper {
    transform: translate(-26px, 5px); // Move left and down
  }
  .info {
    margin-left: auto; // Pushes the info icon to the right
  }
}
</style>
