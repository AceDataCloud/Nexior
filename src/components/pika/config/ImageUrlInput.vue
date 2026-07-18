<template>
  <div class="field">
    <div class="label">
      <h2 class="title font-bold">{{ $t('pika.name.imageUrl') }}</h2>
      <info-icon :content="$t('pika.description.imageUrl')" class="info" />
    </div>
    <div class="upload-control">
      <el-upload
        ref="uploader"
        v-model:file-list="fileList"
        accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
        name="file"
        class="value upload-wrapper"
        :limit="3"
        :multiple="true"
        list-type="picture"
        :action="uploadUrl"
        :on-exceed="onExceed"
        :on-error="onError"
        :on-remove="onRemove"
        :on-success="onSuccess"
        :headers="headers"
      >
        <template #file="{ file }">
          <image-preview
            :url="file.url || (file.response as any)?.file_url"
            :name="file.name"
            :percentage="file.percentage"
            @remove="onRemovePreview(file)"
          />
        </template>
        <el-button size="small" type="primary" round>
          <font-awesome-icon icon="fa-solid fa-upload" class="mr-1" />
          {{ $t('pika.button.uploadImageUrl') }}
        </el-button>
      </el-upload>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFile, UploadFiles } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, pasteUploadMixin, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
export const DEFAULT_CONTENT = '';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'ImageUrlInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    ImagePreview,
    FontAwesomeIcon
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
    urls(): string[] {
      return this.fileList
        .map((file: UploadFile) => (file.response as { file_url?: string } | undefined)?.file_url)
        .filter((url): url is string => Boolean(url));
    },
    value(): string[] | undefined {
      return this.$store.state.pika?.config?.image_url;
    }
  },
  mounted() {
    this.onSetStartImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('pika.message.uploadStartImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('pika.message.uploadStartImageError'));
    },
    onRemove() {
      this.onSetStartImageUrl();
    },
    onSetStartImageUrl() {
      this.$store.commit('pika/setConfig', {
        ...this.$store.state.pika?.config,
        image_url: this.urls
      });
    },
    onSuccess() {
      this.onSetStartImageUrl();
    },
    onRemovePreview(file: UploadFiles[number]) {
      const index = this.fileList.indexOf(file);
      if (index >= 0) this.fileList.splice(index, 1);
      this.onSetStartImageUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 8px;
  align-items: start;

  .label {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .info {
    flex: none;
  }

  .title {
    min-width: 0;
    margin: 0;
    font-size: 14px;
  }

  .upload-control {
    width: 160px;
    min-width: 0;
  }

  .upload-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
  }
}
</style>
