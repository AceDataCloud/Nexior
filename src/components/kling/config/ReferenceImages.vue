<template>
  <div class="relative">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.referenceImages') }}</span>
        <info-icon :content="$t('kling.description.referenceImages')" />
      </div>
      <el-upload
        ref="uploader"
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg"
        name="file"
        :limit="referenceLimit"
        :multiple="true"
        :show-file-list="false"
        :action="uploadUrl"
        :before-upload="beforeUpload"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-success="onSuccess"
        :headers="headers"
      >
        <el-button round type="primary" size="small" :disabled="remainingSlots === 0">
          <UploadIcon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
          {{ $t('kling.button.uploadReferenceImages') }}
        </el-button>
      </el-upload>
    </div>
    <div v-if="fileList.length" class="file-list flex flex-wrap gap-2 mt-2">
      <image-preview
        v-for="(file, index) in fileList"
        :key="file.uid || file.url || index"
        :url="file.url || (file.response as any)?.file_url"
        :name="file.name"
        :percentage="file.percentage"
        @remove="onRemove(index, file)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElUpload, UploadFile, UploadFiles } from 'element-plus';
import { UploadIcon } from '@acedatacloud/core/icons/components';
import ImagePreview from '@/components/common/ImagePreview.vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { IKlingReferenceImage } from '@/models';
import { getBaseUrlPlatform, pasteUploadMixin, dropUploadMixin, uploadTrackerMixin } from '@/utils';
import { stripKlingImageTokens } from '@/utils/kling/capabilities';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'KlingReferenceImages',
  components: {
    ElButton,
    ElUpload,
    UploadIcon,
    ImagePreview,
    InfoIcon
  },
  mixins: [pasteUploadMixin, dropUploadMixin, uploadTrackerMixin],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    config(): Record<string, any> {
      return this.$store.state.kling?.config || {};
    },
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    frameCount(): number {
      return Number(Boolean(this.config.start_image_url)) + Number(Boolean(this.config.end_image_url));
    },
    maxImages(): number {
      return this.config.video_list?.length ? 4 : 7;
    },
    referenceLimit(): number {
      return Math.max(0, this.maxImages - this.frameCount);
    },
    remainingSlots(): number {
      return Math.max(0, this.referenceLimit - this.urls.length);
    },
    urls(): string[] {
      return this.fileList
        .map((file: UploadFile) => (file.response as any)?.file_url || file.url)
        .filter(Boolean) as string[];
    },
    storeImages(): IKlingReferenceImage[] | undefined {
      return this.config.image_list;
    }
  },
  watch: {
    frameCount() {
      this.syncPromptTokens();
    },
    storeImages(value?: IKlingReferenceImage[]) {
      if (!value?.length && this.fileList.length > 0) {
        this.fileList = [];
      }
    }
  },
  methods: {
    beforeUpload(): boolean {
      if (this.remainingSlots === 0) {
        this.onExceed();
        return false;
      }
      return true;
    },
    onExceed() {
      ElMessage.warning(this.$t('kling.message.referenceImagesExceed', { count: this.remainingSlots }));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.referenceImagesError'));
    },
    clearOmniConflicts(config: Record<string, any>): Record<string, any> {
      return {
        ...config,
        generate_audio: false,
        camera_control: undefined,
        cfg_scale: undefined,
        negative_prompt: undefined
      };
    },
    syncPromptTokens(configOverride?: Record<string, any>) {
      const config = configOverride || this.config;
      const prompt = stripKlingImageTokens(config.prompt);
      const tokens = this.urls.map((_, index) => `<<<image_${this.frameCount + index + 1}>>>`);
      const nextPrompt = [prompt, ...tokens].filter(Boolean).join(' ');
      if (nextPrompt !== config.prompt) {
        this.$store.commit('kling/setConfig', { ...config, prompt: nextPrompt });
      }
    },
    syncConfig() {
      const image_list: IKlingReferenceImage[] | undefined = this.urls.length
        ? this.urls.map((image_url) => ({ image_url }))
        : undefined;
      const next = this.clearOmniConflicts({ ...this.config, image_list });
      this.$store.commit('kling/setConfig', next);
      this.syncPromptTokens(next);
    },
    async onSuccess(response: any, file: UploadFile) {
      if (response?.file_url) {
        file.url = response.file_url;
        file.response = response;
      }
      this.syncConfig();
    },
    onRemove(index: number, file: UploadFile) {
      this.fileList.splice(index, 1);
      if (file.url?.startsWith('blob:')) URL.revokeObjectURL(file.url);
      this.syncConfig();
    }
  }
});
</script>
