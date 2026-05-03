<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.motionImage') }}</span>
        <info-icon :content="$t('kling.description.motionImage')" />
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
      :headers="headers"
    >
      <template #file="{ file }">
        <image-preview
          v-if="file.url && file.percentage !== undefined"
          :url="file.url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="onRemove(file)"
        />
      </template>
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('kling.button.uploadReferences') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, pasteUploadMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'MotionImage',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FontAwesomeIcon,
    ImagePreview
  },
  mixins: [pasteUploadMixin],
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
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  mounted() {
    this.onSetImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('kling.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.uploadReferencesError'));
    },
    onRemove(file: UploadFile) {
      this.fileList.splice(this.fileList.indexOf(file), 1);
      this.$store.commit('kling/setMotionConfig', {
        ...this.$store.state.kling?.motionConfig,
        image_url: undefined
      });
    },
    onSetImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('kling/setMotionConfig', {
        ...this.$store.state.kling?.motionConfig,
        image_url: url
      });
    },
    async onSuccess() {
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
