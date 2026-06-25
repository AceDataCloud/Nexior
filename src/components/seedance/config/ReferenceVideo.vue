<template>
  <div v-if="capability.acceptsReferenceVideo" class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('seedance.name.referenceVideo') }}</span>
        <info-icon :content="$t('seedance.description.referenceVideo')" />
      </div>
    </div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      name="file"
      accept=".mp4,.mov,.webm,.mkv,.avi"
      :limit="1"
      class="upload-wrapper"
      :multiple="false"
      :action="uploadUrl"
      list-type="text"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :on-remove="onRemove"
      :headers="headers"
    >
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('seedance.button.upload') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { getSeedanceCapability } from '@/constants';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'SeedanceReferenceVideo',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
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
    model(): string | undefined {
      return this.$store.state.seedance?.config?.model;
    },
    capability() {
      return getSeedanceCapability(this.model);
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  watch: {
    'capability.acceptsReferenceVideo'(accepts: boolean) {
      if (!accepts) {
        this.fileList = [];
        this.onSetReferenceVideos();
      }
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('seedance.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('seedance.message.uploadError'));
    },
    onSetReferenceVideos() {
      const urls = (this.urls || []).filter(Boolean) as string[];
      this.$store.commit('seedance/setConfig', {
        ...this.$store.state.seedance?.config,
        videos: urls.length > 0 ? urls.map((url) => ({ url })) : undefined
      });
    },
    async onSuccess() {
      this.onSetReferenceVideos();
    },
    async onRemove() {
      this.onSetReferenceVideos();
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

<style lang="scss">
.upload-wrapper {
  height: auto;
  display: flex;
  .el-upload-list {
    margin: 0;
    width: 100%;
  }
}
</style>
