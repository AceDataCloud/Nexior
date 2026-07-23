<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ title }}</span>
        <info-icon :content="description" />
      </div>
    </div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      name="file"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      :limit="limit"
      class="upload-wrapper"
      :multiple="true"
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
        <upload-icon class="icon mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('veo.button.uploadReferences') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { UploadIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { getBaseUrlPlatform, pasteUploadMixin, dropUploadMixin, uploadTrackerMixin } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'StartEndImage',
  components: {
    UploadIcon,
    ElUpload,
    ElButton,
    InfoIcon,
    ImagePreview
  },
  mixins: [pasteUploadMixin, dropUploadMixin, uploadTrackerMixin],
  props: {
    limit: {
      type: Number,
      default: 2
    },
    ingredients: {
      type: Boolean,
      default: false
    }
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
    title() {
      return this.ingredients ? this.$t('veo.button.actionIngredients') : this.$t('veo.name.startEndImage');
    },
    description() {
      return this.ingredients ? this.$t('veo.description.imageUrl') : this.$t('veo.description.uploadStartEndImage');
    },
    urls() {
      return this.fileList
        .map((file: UploadFile) => (file.response as { file_url?: string } | undefined)?.file_url || file.url)
        .filter((url): url is string => Boolean(url));
    },
    value: {
      get() {
        return this.$store.state?.veo?.config?.image_urls;
      },
      set() {
        // this.$store.commit('veo/setConfig', {
        //   ...this.$store.state?.veo?.config,
        //   start_image_url: val
        // });
      }
    }
  },
  watch: {
    limit() {
      if (this.fileList.length > this.limit) {
        this.fileList = this.fileList.slice(0, this.limit);
        this.onSetStartEndImageUrl();
      }
    }
  },
  mounted() {
    this.fileList = (this.value || []).map((url: string, index: number) => ({
      name: `reference-${index + 1}`,
      percentage: 100,
      response: { file_url: url },
      status: 'success',
      uid: Date.now() + index,
      url
    }));
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('veo.message.uploadReferencesLimit', { limit: this.limit }));
    },
    onError() {
      ElMessage.error(this.$t('veo.message.uploadReferencesError'));
    },
    onSetStartEndImageUrl() {
      const urls = this.urls;
      this.$store.commit('veo/setConfig', {
        ...this.$store.state?.veo?.config,
        image_urls: urls
      });
    },
    async onSuccess() {
      this.onSetStartEndImageUrl();
    },
    onRemove(file: UploadFile) {
      const index = this.fileList.indexOf(file);
      if (index >= 0) {
        this.fileList.splice(index, 1);
      }
      this.onSetStartEndImageUrl();
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
  margin-top: 8px;
}
</style>

<style lang="scss">
.upload-wrapper {
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .el-upload-list {
    order: 2;
    margin: 8px 0 0;
    width: 100%;
  }
}
</style>
