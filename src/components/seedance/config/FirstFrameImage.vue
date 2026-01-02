<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('seedance.name.firstFrame') }}</span>
        <info-icon :content="$t('seedance.description.firstFrame')" />
      </div>
    </div>
    <el-upload
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
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { ISeedanceImageInput } from '@/models';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'SeedanceFirstFrameImage',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FontAwesomeIcon,
    ImagePreview
  },
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
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('seedance.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('seedance.message.uploadError'));
    },
    onSetFirstFrameUrl() {
      const url = this.urls?.[0];
      const existing = (this.$store.state.seedance?.config?.images || []) as ISeedanceImageInput[];
      const next = existing.filter((item) => item?.role !== 'first_frame');
      if (url) {
        next.push({ url, role: 'first_frame' });
      }
      this.$store.commit('seedance/setConfig', {
        ...this.$store.state.seedance?.config,
        images: next.length > 0 ? next : undefined
      });
    },
    async onSuccess() {
      this.onSetFirstFrameUrl();
    },
    async onRemove() {
      this.onSetFirstFrameUrl();
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
