<template>
  <div class="relative">
    <div class="flex justify-between items-center mb-2">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('producer.name.referenceAudios') }}</span>
        <info-icon :content="$t('producer.description.uploadAudios')" />
      </div>
      <el-upload
        v-model:file-list="fileList"
        name="file"
        :limit="1"
        class="upload-wrapper inline-upload"
        :action="uploadUrl"
        accept=".mp3,.wav,.m4a,audio/*"
        :show-file-list="false"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button round type="primary" size="small" :loading="uploading">
          <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
          {{ $t('producer.button.uploadAudios') }}
        </el-button>
      </el-upload>
    </div>
    <div v-if="audioPreviewUrl" class="mb-2">
      <audio :src="audioPreviewUrl" controls class="w-full" />
    </div>
    <div v-if="hasUploadedAudio" class="mt-1">
      <el-radio-group v-model="uploadAction" size="small">
        <el-radio-button value="upload_extend">{{ $t('producer.button.extend') }}</el-radio-button>
        <el-radio-button value="upload_cover">{{ $t('producer.button.cover_music') }}</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, ElRadioGroup, ElRadioButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { IProducerUploadRequest } from '@/models';
import { producerOperator } from '@/operators';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  audioPreviewUrl: string | null;
  uploading: boolean;
}

export default defineComponent({
  name: 'UploadAudio',
  components: {
    ElUpload,
    ElButton,
    ElRadioGroup,
    ElRadioButton,
    InfoIcon,
    FontAwesomeIcon
  },
  emits: ['change'],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      audioPreviewUrl: null,
      uploading: false
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    credential() {
      return this.$store.state.producer.credential;
    },
    config() {
      return this.$store.state.producer.config;
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    hasUploadedAudio() {
      const action = this.$store.state.producer?.config?.action;
      return action === 'upload_extend' || action === 'upload_cover';
    },
    uploadAction: {
      get() {
        return this.$store.state.producer?.config?.action || 'upload_extend';
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          action: val
        });
      }
    }
  },
  watch: {
    urls: {
      handler(val) {
        this.$emit('change', val);
      }
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('producer.message.uploadReferencesExceed'));
    },
    onError() {
      this.uploading = false;
      ElMessage.error(this.$t('producer.message.uploadReferencesError'));
    },
    async onSuccess() {
      const url = this.urls?.[0];
      if (!url) {
        this.uploading = false;
        return;
      }
      this.audioPreviewUrl = url;
      await this.onGenerateAudioId(url);
    },
    async onGenerateAudioId(audio_url: string) {
      const request = { audio_url } as IProducerUploadRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        this.uploading = false;
        return;
      }
      this.uploading = true;
      ElMessage.info(this.$t('producer.message.startingUploadAudio'));
      try {
        const response = await producerOperator.upload(request, { token });
        const audio_id = response.data?.data.audio_id;
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          audio_id,
          action: 'upload_extend'
        });
        ElMessage.success(this.$t('producer.message.startUploadAudioSuccess'));
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.error?.message || this.$t('producer.message.startUploadAudioFailed'));
      } finally {
        this.uploading = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.upload-wrapper.inline-upload {
  :deep(.el-upload) {
    display: inline-flex;
  }
}
</style>
