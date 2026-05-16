<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.motionVideo') }}</span>
        <info-icon :content="$t('kling.description.motionVideo')" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      accept=".mp4,.mov"
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
          v-if="file.percentage !== undefined"
          :url="file.url || (file.response as any)?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="onRemove(file)"
        />
      </template>
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('kling.button.uploadVideoUrl') }}
      </el-button>
    </el-upload>
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
  name: 'MotionVideo',
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
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  mounted() {
    this.onSetVideoUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('kling.message.uploadVideoExceed'));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.uploadVideoError'));
    },
    onRemove(file: UploadFile) {
      this.fileList.splice(this.fileList.indexOf(file), 1);
      this.$store.commit('kling/setMotionConfig', {
        ...this.$store.state.kling?.motionConfig,
        video_url: undefined
      });
    },
    beforeUpload(file: File) {
      const isMP4orMOV = file.type === 'video/mp4' || file.type === 'video/quicktime';
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isMP4orMOV) {
        ElMessage.error(this.$t('kling.message.uploadVideoTypeFailed'));
        return false;
      }
      if (!isLt100M) {
        ElMessage.error(this.$t('kling.message.uploadVideoSizeExceed'));
        return false;
      }
      return true;
    },
    onSetVideoUrl() {
      const url = this.urls?.[0];
      this.$store.commit('kling/setMotionConfig', {
        ...this.$store.state.kling?.motionConfig,
        video_url: url
      });
    },
    async onSuccess() {
      this.onSetVideoUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.btn.btn-upload {
  position: absolute;
  top: 5px;
  right: 0;
}
</style>
