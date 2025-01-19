<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('suno.name.referenceAudios') }}</span>
        <info-icon :content="$t('suno.description.uploadAudios')" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      name="file"
      :limit="1"
      class="upload-wrapper"
      :action="uploadUrl"
      accept=".mp3"
      :show-file-list="true"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :headers="headers"
    >
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('suno.button.uploadAudios') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { ISunoUploadRequest } from '@/models';
import { sunoOperator } from '@/operators';
interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'UploadAudio',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FontAwesomeIcon
  },
  emits: ['change'],
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
    credential() {
      return this.$store.state.suno.credential;
    },
    config() {
      return this.$store.state.suno.config;
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.suno?.config?.audio_id;
      },
      set(val: string[]) {}
    }
  },
  watch: {
    urls: {
      handler(val) {
        this.$emit('change', val);
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetAudio();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('suno.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('suno.message.uploadReferencesError'));
    },
    async onSuccess() {
      const url = this.urls?.[0];
      await this.onGenerateAudioId(url);
    },
    async onGenerateAudioId(audio_url: string) {
      const request = {
        audio_url
      } as ISunoUploadRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('suno.message.startingUploadAudio'));
      sunoOperator
        .upload(request, {
          token
        })
        .then((response) => {
          console.debug('get upload music success', response.data);
          const audio_id = response.data?.data.audio_id;
          this.$store.commit('suno/setConfig', {
            ...this.$store.state.suno?.config,
            audio_id: audio_id,
            action: 'upload_extend'
          });
          ElMessage.success(this.$t('suno.message.startUploadAudioSuccess'));
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.startUploadAudioFailed'));
        });
    },
    onSetAudio() {
      // const url = this.urls?.[0];
      // this.$store.commit('suno/setConfig', {
      //   ...this.$store.state.suno?.config,
      //   audio_id: url
      // });
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
