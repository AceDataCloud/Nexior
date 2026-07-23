<template>
  <div class="relative">
    <div class="flex min-h-8 items-center pr-20">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.referenceVideo') }}</span>
        <info-icon :content="$t('kling.description.omniReferenceVideo')" />
      </div>
    </div>
    <el-upload
      ref="uploader"
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
        <upload-icon class="icon mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('kling.button.uploadReferenceVideo') }}
      </el-button>
    </el-upload>
    <div v-if="hasVideo" class="reference-options mt-3 flex flex-col gap-3">
      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span class="text-sm">{{ $t('kling.name.referenceVideoType') }}</span>
        <el-radio-group v-model="referenceType" size="small">
          <el-radio-button value="feature">{{ $t('kling.name.referenceVideoFeature') }}</el-radio-button>
          <el-radio-button value="base">{{ $t('kling.name.referenceVideoBase') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm">{{ $t('kling.name.keepOriginalSound') }}</span>
        <el-switch v-model="keepOriginalSound" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import {
  ElButton,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElSwitch,
  ElUpload,
  UploadFile,
  UploadFiles
} from 'element-plus';
import { getBaseUrlPlatform, uploadTrackerMixin, dropUploadMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import FilePreview from '@/components/common/FilePreview.vue';
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
    ElRadioButton,
    ElRadioGroup,
    ElSwitch,
    InfoIcon,
    FilePreview,
    UploadIcon
  },
  mixins: [dropUploadMixin, uploadTrackerMixin],
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
    config(): Record<string, any> {
      return this.$store.state.kling?.config || {};
    },
    hasVideo(): boolean {
      return Boolean(this.urls?.[0]);
    },
    referenceType: {
      get(): 'feature' | 'base' {
        return this.config.video_list?.[0]?.refer_type || 'feature';
      },
      set(value: 'feature' | 'base') {
        this.updateVideoOptions(value, this.keepOriginalSound);
      }
    },
    keepOriginalSound: {
      get(): boolean {
        return this.config.video_list?.[0]?.keep_original_sound === 'yes';
      },
      set(value: boolean) {
        this.updateVideoOptions(this.referenceType, value);
      }
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
      const referenceImageCount =
        (this.config.image_list?.length || 0) +
        Number(Boolean(this.config.start_image_url)) +
        Number(Boolean(this.config.end_image_url));
      if (referenceImageCount > 4) {
        ElMessage.error(this.$t('kling.message.referenceVideoImageLimit'));
        return false;
      }
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
        ? [
            {
              video_url: url,
              refer_type: this.referenceType,
              keep_original_sound: this.keepOriginalSound ? 'yes' : 'no'
            }
          ]
        : undefined;
      this.$store.commit('kling/setConfig', {
        ...this.config,
        video_list,
        generate_audio: false,
        camera_control: undefined,
        cfg_scale: undefined,
        negative_prompt: undefined
      });
      this.ensurePromptToken(!!url);
    },
    updateVideoOptions(referType: 'feature' | 'base', keepSound: boolean) {
      const url = this.urls?.[0];
      if (!url) return;
      this.$store.commit('kling/setConfig', {
        ...this.config,
        video_list: [
          {
            video_url: url,
            refer_type: referType,
            keep_original_sound: keepSound ? 'yes' : 'no'
          }
        ],
        ...(referType === 'base' ? { start_image_url: undefined, end_image_url: undefined } : {}),
        generate_audio: false,
        camera_control: undefined,
        cfg_scale: undefined,
        negative_prompt: undefined
      });
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
