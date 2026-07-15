<template>
  <div class="field flex items-center justify-between">
    <h2 class="title font-bold text-[14px] mb-[10px]">{{ $t('omni.name.referenceVideo') }}</h2>
    <div class="upload-wrapper flex flex-col items-start gap-[8px]">
      <div class="controls flex items-center">
        <el-upload
          v-model:file-list="fileList"
          accept=".mp4,.mov"
          name="file"
          class="value"
          :show-file-list="false"
          :limit="1"
          :multiple="false"
          :action="uploadUrl"
          :before-upload="beforeUpload"
          :on-exceed="onExceed"
          :on-error="onError"
          :on-success="onSuccess"
          :headers="headers"
        >
          <el-button size="small" type="primary" round>
            <font-awesome-icon icon="fa-solid fa-upload" class="mr-1" />
            {{ $t('omni.button.uploadVideo') }}
          </el-button>
        </el-upload>
        <info-icon :content="$t('omni.description.referenceVideo')" class="ml-2" />
      </div>
    </div>
  </div>
  <div v-if="videoUrl" class="file-list flex flex-wrap gap-[10px]">
    <file-preview :url="videoUrl" :name="videoName" :percentage="100" @remove="onRemove" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile } from 'element-plus';
import { getBaseUrlPlatform, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import FilePreview from '@/components/common/FilePreview.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'OmniVideoInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FilePreview,
    FontAwesomeIcon
  },
  mixins: [uploadTrackerMixin],
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
    videoUrl(): string | undefined {
      return this.$store.state.omni?.config?.video_urls?.[0];
    },
    videoName(): string {
      const url = this.videoUrl || '';
      return url.split('/').pop() || url;
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('omni.message.uploadVideoExceed'));
    },
    onError() {
      ElMessage.error(this.$t('omni.message.uploadVideoError'));
    },
    beforeUpload(file: File) {
      const isMP4orMOV = file.type === 'video/mp4' || file.type === 'video/quicktime';
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isMP4orMOV) {
        ElMessage.error(this.$t('omni.message.uploadVideoTypeFailed'));
        return false;
      }
      if (!isLt200M) {
        ElMessage.error(this.$t('omni.message.uploadVideoSizeExceed'));
        return false;
      }
      return true;
    },
    setVideoUrls(url?: string) {
      this.$store.commit('omni/setConfig', {
        ...this.$store.state.omni?.config,
        video_urls: url ? [url] : undefined
      });
    },
    onRemove() {
      this.fileList = [];
      this.setVideoUrls(undefined);
    },
    async onSuccess(response: any, file: UploadFile) {
      const url = response?.file_url || (file?.response as any)?.file_url;
      this.setVideoUrls(url || undefined);
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
}
</style>
