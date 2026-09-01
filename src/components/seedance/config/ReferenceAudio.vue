<template>
  <div v-if="capability.acceptsReferenceAudio" class="relative">
    <div class="flex min-h-8 items-center pr-20">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('seedance.name.referenceAudio') }}</span>
        <info-icon :content="$t('seedance.description.referenceAudio')" />
      </div>
    </div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      name="file"
      accept=".mp3,.wav,.m4a,.aac,.ogg,.flac"
      :limit="capability.maxReferenceAudios"
      class="upload-wrapper"
      :multiple="capability.maxReferenceAudios > 1"
      :before-upload="onBeforeUpload"
      :action="uploadUrl"
      list-type="text"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :on-remove="onRemove"
      :headers="headers"
    >
      <el-tooltip :content="uploadTooltip" :disabled="!uploadDisabled" placement="top">
        <span>
          <el-button round type="primary" size="small" class="btn btn-upload" :disabled="uploadDisabled">
            <upload-icon class="icon mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('seedance.button.upload') }}
          </el-button>
        </span>
      </el-tooltip>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElUpload, ElButton, ElTooltip, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { getBaseUrlPlatform, uploadTrackerMixin, dropUploadMixin, uploadSizeGuardMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { getSeedanceCapability } from '@/constants';
import { getSeedanceInputModes } from '@/utils/seedance';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'SeedanceReferenceAudio',
  components: {
    UploadIcon,
    ElUpload,
    ElButton,
    ElTooltip,
    InfoIcon
  },
  mixins: [dropUploadMixin, uploadTrackerMixin, uploadSizeGuardMixin],
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
    inputModes() {
      return getSeedanceInputModes(this.$store.state.seedance?.config);
    },
    uploadDisabled(): boolean {
      return this.inputModes.frame;
    },
    dropDisabled(): boolean {
      return this.uploadDisabled;
    },
    uploadTooltip(): string {
      return this.uploadDisabled ? this.$t('seedance.message.referenceUploadBlocked') : '';
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  watch: {
    'capability.acceptsReferenceAudio'(accepts: boolean) {
      if (!accepts) {
        this.fileList = [];
        this.onSetReferenceAudios();
      }
    }
  },
  methods: {
    onBeforeUpload(file: File): boolean {
      if (this.uploadDisabled) {
        ElMessage.warning(this.$t('seedance.message.referenceUploadBlocked'));
        return false;
      }
      return this.beforeUploadSizeGuard(file);
    },
    onExceed() {
      ElMessage.warning(this.$t('seedance.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('seedance.message.uploadError'));
    },
    onSetReferenceAudios() {
      const urls = (this.urls || []).filter(Boolean) as string[];
      this.$store.commit('seedance/setConfig', {
        ...this.$store.state.seedance?.config,
        audios: urls.length > 0 ? urls.map((url) => ({ url })) : undefined
      });
    },
    async onSuccess() {
      this.onSetReferenceAudios();
    },
    async onRemove() {
      this.onSetReferenceAudios();
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
