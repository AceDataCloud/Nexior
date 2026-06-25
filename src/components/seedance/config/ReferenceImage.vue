<template>
  <div v-if="capability.acceptsReferenceImage" class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('seedance.name.referenceImage') }}</span>
        <info-icon :content="$t('seedance.description.referenceImage')" />
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
        {{ $t('seedance.button.upload') }}
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
import { ISeedanceImageInput } from '@/models';
import { getSeedanceCapability } from '@/constants';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'SeedanceReferenceImage',
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
    'capability.acceptsReferenceImage'(accepts: boolean) {
      if (!accepts) {
        this.fileList = [];
        this.onSetReferenceImageUrls();
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
    onSetReferenceImageUrls() {
      const urls = (this.urls || []).filter(Boolean) as string[];
      const existing = (this.$store.state.seedance?.config?.images || []) as ISeedanceImageInput[];
      const next = existing.filter((item) => item?.role !== 'reference_image');
      urls.forEach((url) => next.push({ url, role: 'reference_image' }));
      this.$store.commit('seedance/setConfig', {
        ...this.$store.state.seedance?.config,
        images: next.length > 0 ? next : undefined
      });
    },
    async onSuccess() {
      this.onSetReferenceImageUrls();
    },
    async onRemove() {
      this.onSetReferenceImageUrls();
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
