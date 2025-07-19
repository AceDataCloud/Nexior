<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('hailuo.name.startImageUrl') }}</span>
        <info-icon :content="$t('hailuo.description.startImageUrl')" class="info" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      name="file"
      class="upload-wrapper"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
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
          :url="file.url || file.response?.file_url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-button size="small" type="primary" class="btn btn-upload" round>{{
        $t('hailuo.button.uploadStartImageUrl')
      }}</el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

export const DEFAULT_CONTENT = '';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'StartImageUrlInput',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
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
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.hailuo?.config?.first_image_url;
      },
      set() {
        const url = this.urls?.[0];
        this.$store.commit('hailuo/setConfig', {
          ...this.$store.state.hailuo?.config,
          first_image_url: url
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetStartImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('hailuo.message.uploadStartImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('hailuo.message.uploadStartImageError'));
    },
    async onRemove() {
      ElMessage.error(this.$t('hailuo.message.uploadStartImageError'));
    },
    onSetStartImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('hailuo/setConfig', {
        ...this.$store.state.hailuo?.config,
        first_image_url: url
      });
    },
    async onSuccess() {
      this.onSetStartImageUrl();
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
