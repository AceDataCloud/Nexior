<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.referenceVideo') }}</span>
        <info-icon :content="$t('kling.description.referenceVideo')" />
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
        {{ $t('kling.button.uploadReferenceVideo') }}
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
import { IKlingReferenceVideo } from '@/models';
import { KLING_VIDEO_TOKEN, stripKlingVideoToken } from '@/utils/kling/capabilities';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'ReferenceVideo',
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
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('kling.message.referenceVideoExceed'));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.referenceVideoError'));
    },
    beforeUpload(file: File) {
      const isMP4orMOV = file.type === 'video/mp4' || file.type === 'video/quicktime';
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isMP4orMOV) {
        ElMessage.error(this.$t('kling.message.referenceVideoTypeFailed'));
        return false;
      }
      if (!isLt200M) {
        ElMessage.error(this.$t('kling.message.referenceVideoSizeExceed'));
        return false;
      }
      return true;
    },
    ensurePromptToken(add: boolean) {
      const config = this.$store.state.kling?.config;
      const prompt = config?.prompt || '';
      const has = prompt.includes(KLING_VIDEO_TOKEN);
      let next: string;
      if (add && !has) {
        next = prompt ? `${prompt} ${KLING_VIDEO_TOKEN}` : KLING_VIDEO_TOKEN;
      } else if (!add && has) {
        next = stripKlingVideoToken(prompt);
      } else {
        return;
      }
      this.$store.commit('kling/setConfig', { ...config, prompt: next });
    },
    onRemove(file: UploadFile) {
      this.fileList.splice(this.fileList.indexOf(file), 1);
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling?.config,
        video_list: undefined
      });
      this.ensurePromptToken(false);
    },
    onSetVideoList() {
      const url = this.urls?.[0];
      const video_list: IKlingReferenceVideo[] | undefined = url
        ? [{ video_url: url, refer_type: 'base', keep_original_sound: 'no' }]
        : undefined;
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling?.config,
        video_list
      });
      this.ensurePromptToken(!!url);
    },
    async onSuccess() {
      this.onSetVideoList();
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
