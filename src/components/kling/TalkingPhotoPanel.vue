<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Portrait image -->
      <div class="relative mb-4">
        <div class="flex justify-start items-center">
          <span class="text-sm font-bold">{{ $t('kling.name.talkingPhotoImage') }}</span>
          <info-icon :content="$t('kling.description.talkingPhotoImage')" />
        </div>
        <el-upload
          ref="imageUploader"
          v-model:file-list="imageFiles"
          name="file"
          accept=".png,.jpg,.jpeg,.webp,.bmp"
          :limit="1"
          class="upload-wrapper"
          :multiple="false"
          :action="uploadUrl"
          list-type="picture"
          :headers="headers"
          :on-exceed="onImageExceed"
          :on-error="onImageError"
          :on-success="onImageSuccess"
        >
          <template #file="{ file }">
            <image-preview
              v-if="file.url && file.percentage !== undefined"
              :url="file.url"
              :name="file.name"
              :percentage="file.percentage"
              @remove="onImageRemove(file)"
            />
          </template>
          <el-button round type="primary" size="small" class="btn btn-upload">
            <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
            {{ $t('kling.button.uploadReferences') }}
          </el-button>
        </el-upload>
      </div>

      <!-- Driving audio -->
      <div class="relative mb-4">
        <div class="flex justify-start items-center">
          <span class="text-sm font-bold">{{ $t('kling.name.talkingPhotoAudio') }}</span>
          <info-icon :content="$t('kling.description.talkingPhotoAudio')" />
        </div>
        <el-upload
          ref="audioUploader"
          v-model:file-list="audioFiles"
          name="file"
          accept=".mp3,.wav,.m4a,.aac"
          :limit="1"
          class="upload-wrapper"
          :multiple="false"
          :action="uploadUrl"
          :headers="headers"
          :on-exceed="onAudioExceed"
          :on-error="onAudioError"
          :on-success="onAudioSuccess"
          :on-remove="onAudioRemove"
        >
          <el-button round type="primary" size="small" class="btn">
            <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
            {{ $t('kling.button.uploadAudio') }}
          </el-button>
        </el-upload>
        <audio v-if="audioUrl" :src="audioUrl" controls class="w-full mt-2" />
      </div>

      <!-- Optional prompt -->
      <div class="mb-4">
        <div class="flex justify-start items-center">
          <span class="text-sm font-bold">{{ $t('kling.name.talkingPhotoPrompt') }}</span>
          <info-icon :content="$t('kling.description.talkingPhotoPrompt')" />
        </div>
        <el-input
          :model-value="config.prompt"
          type="textarea"
          :rows="2"
          :placeholder="$t('kling.placeholder.talkingPhotoPrompt')"
          class="mt-1"
          @update:model-value="onPromptChange"
        />
      </div>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.generateTalkingPhoto') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, ElInput, ElMessage, UploadFiles, UploadFile } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { getBaseUrlPlatform, getConsumption, uploadTrackerMixin } from '@/utils';
import { IKlingTalkingPhotoConfig } from '@/models';

interface IData {
  imageFiles: UploadFiles;
  audioFiles: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'TalkingPhotoPanel',
  components: {
    ElUpload,
    ElButton,
    ElInput,
    FontAwesomeIcon,
    Consumption,
    InfoIcon,
    ImagePreview
  },
  mixins: [uploadTrackerMixin],
  emits: ['generate'],
  data(): IData {
    return {
      imageFiles: [],
      audioFiles: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    config(): IKlingTalkingPhotoConfig {
      return this.$store.state.kling?.talkingPhotoConfig || {};
    },
    audioUrl(): string | undefined {
      return this.config.audio_url;
    },
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    service() {
      return this.$store.state.kling?.service;
    },
    consumption() {
      return getConsumption({ ...this.config, action: 'talking-photo' }, this.service?.cost);
    },
    canGenerate(): boolean {
      return Boolean(this.config.image_url && this.config.audio_url);
    }
  },
  methods: {
    commit(patch: Partial<IKlingTalkingPhotoConfig>) {
      this.$store.commit('kling/setTalkingPhotoConfig', { ...this.config, ...patch });
    },
    onPromptChange(value: string) {
      this.commit({ prompt: value });
    },
    onImageExceed() {
      ElMessage.warning(this.$t('kling.message.uploadReferencesExceed'));
    },
    onImageError() {
      ElMessage.error(this.$t('kling.message.uploadReferencesError'));
    },
    onImageSuccess(response: any) {
      this.commit({ image_url: response?.file_url });
    },
    onImageRemove(file: UploadFile) {
      this.imageFiles.splice(this.imageFiles.indexOf(file), 1);
      this.commit({ image_url: undefined });
    },
    onAudioExceed() {
      ElMessage.warning(this.$t('kling.message.uploadAudioExceed'));
    },
    onAudioError() {
      ElMessage.error(this.$t('kling.message.uploadAudioError'));
    },
    onAudioSuccess(response: any) {
      this.commit({ audio_url: response?.file_url });
    },
    onAudioRemove() {
      this.commit({ audio_url: undefined });
    },
    onGenerate() {
      this.$emit('generate');
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
  flex-direction: column;
  .el-upload-list {
    margin: 0;
    width: 100%;
  }
}
</style>
