<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('wan.name.imageUrl') }}</span>
        <info-icon :content="$t('wan.description.imageUrl')" class="info" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      name="file"
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
          v-if="file.url && file.percentage !== undefined"
          :url="file.url"
          :name="file.name"
          :percentage="file.percentage"
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-button size="small" type="primary" class="btn btn-upload" round>
        {{ $t('wan.button.uploadImageUrl') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile } from 'element-plus';
import { getBaseUrlPlatform, pasteUploadMixin } from '@/utils';
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
    urls(): string[] {
      return this.fileList.map((file: UploadFile) => file.url).filter((url: string | undefined) => url !== undefined);
    },
    value: {
      get() {
        return this.$store.state.wan?.config?.image_url;
      },
      set() {
        const url = this.urls?.[0];
        this.$store.commit('wan/setConfig', {
          ...this.$store.state.wan?.config,
          image_url: url
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('wan.message.uploadImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('wan.message.uploadImageError'));
    },
    async onRemove() {
      ElMessage.error(this.$t('wan.message.uploadImageError'));
    },
    onSetImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('wan/setConfig', {
        ...this.$store.state.wan?.config,
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
