<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('grokvideo.name.image') }}</span>
        <span v-if="required" class="required-badge">
          {{ $t('grokvideo.name.required') }}
        </span>
        <info-icon :content="$t('grokvideo.description.image')" />
      </div>
    </div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      name="file"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      :limit="1"
      class="upload-wrapper"
      :multiple="false"
      :action="uploadUrl"
      list-type="picture"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :on-remove="onRemove"
      :headers="headers"
    >
      <template #file="{ file }">
        <image-preview
          v-if="file.url && file.percentage !== undefined"
          :url="file.url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('grokvideo.button.upload') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, pasteUploadMixin, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { isGrokVideoImageOnlyModel } from '@/constants';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'GrokVideoImageInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FontAwesomeIcon,
    ImagePreview
  },
  mixins: [pasteUploadMixin, uploadTrackerMixin],
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
    required(): boolean {
      return isGrokVideoImageOnlyModel(this.$store.state.grokvideo?.config?.model);
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('grokvideo.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('grokvideo.message.uploadError'));
    },
    onSetImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('grokvideo/setConfig', {
        ...this.$store.state.grokvideo?.config,
        image_url: url || undefined
      });
    },
    async onSuccess() {
      this.onSetImageUrl();
    },
    async onRemove() {
      this.onSetImageUrl();
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
.required-badge {
  margin-left: 6px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  border-radius: 8px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
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
