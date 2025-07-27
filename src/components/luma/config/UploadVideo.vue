<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('luma.name.videoUrl') }}</span>
        <info-icon :content="$t('luma.description.videoUrl')" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      accept=".mp4"
      name="file"
      class="value"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
      :action="uploadUrl"
      :before-upload="beforeUpload"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :headers="headers"
    >
      <template #file="{ file }">
        <file-preview
          v-if="file.percentage != undefined"
          :url="file.url || (file.response as any)?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('luma.button.uploadVideoUrl') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import FilePreview from '@/components/common/FilePreview.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export const DEFAULT_CONTENT = '';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'UploadVideo',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FilePreview,
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
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.luma?.config?.video_url;
      },
      set() {
        const url = this.urls?.[0];
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          video_url: url
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    // this.onSetVideoUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('luma.message.uploadVideoExceed'));
    },
    onError() {
      ElMessage.error(this.$t('luma.message.uploadVideoError'));
    },
    beforeUpload(file: File) {
      const isMP4 = file.type === 'video/mp4';
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isMP4) {
        ElMessage.error(this.$t('luma.message.uploadVideoTypeFailed'));
        return false;
      }
      if (!isLt10M) {
        ElMessage.error(this.$t('luma.message.uploadVideoSizeExceed'));
        return false;
      }
      return true;
    },
    onSetVideoUrl() {
      const url = this.urls?.[0];
      this.$store.commit('luma/setConfig', {
        ...this.$store.state.luma?.config,
        video_url: url,
        action: 'extend'
      });
    },
    async onSuccess() {
      this.onSetVideoUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 0;
  width: 30%;
}
.btn.btn-upload {
  position: absolute;
  top: 5px;
  right: 0;
}
</style>
