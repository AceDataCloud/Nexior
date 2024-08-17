<template>
  <div class="field">
    <h2 class="title">{{ $t('luma.name.endImageUrl') }}</h2>
    <div class="upload-wrapper">
      <el-upload
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value"
        :show-file-list="true"
        :limit="1"
        :multiple="false"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button size="small" type="primary" round>{{ $t('luma.button.uploadEndImageUrl') }}</el-button>
      </el-upload>
    </div>
    <info-icon :content="$t('luma.description.endImageUrl')" class="info" />
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
  name: 'ContentInput',
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
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.luma?.config?.end_image_url;
      },
      set(val: string) {
        const url = this.urls?.[0];
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          end_image_url: url
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetEndImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('luma.message.uploadEndImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('luma.message.uploadEndImageError'));
    },
    onSetEndImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('luma/setConfig', {
        ...this.$store.state.luma?.config,
        end_image_url: url
      });
    },
    async onSuccess() {
      this.onSetEndImageUrl();
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
