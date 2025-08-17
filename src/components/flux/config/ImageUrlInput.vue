<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('flux.name.imageUrl') }}</span>
        <info-icon :content="$t('flux.description.imageUrl')" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      name="file"
      :limit="5"
      class="upload-wrapper"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      :multiple="true"
      list-type="picture"
      :action="uploadUrl"
      :on-exceed="onExceed"
      :on-error="onError"
      :headers="headers"
    >
      <template #file="{ file }">
        <image-preview
          :url="file.url || (file.response as any)?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('flux.button.uploadImageUrl') }}
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
    FontAwesomeIcon,
    ImagePreview
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
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  watch: {
    urls: {
      handler(val) {
        console.debug('URLs changed:', val);
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          image_url: val[0]
        });
      }
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('flux.message.uploadStartImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('flux.message.uploadStartImageError'));
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
