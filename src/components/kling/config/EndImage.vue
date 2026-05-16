<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.endImage') }}</span>
        <info-icon :content="$t('kling.description.uploadEndImage')" />
      </div>
    </div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      name="file"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      :limit="1"
      :disabled="uploadDisabled"
      class="upload-wrapper"
      :multiple="false"
      :action="uploadUrl"
      list-type="picture"
      :before-upload="onBeforeUpload"
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
          @remove="fileList.splice(fileList.indexOf(file), 1)"
        />
      </template>
      <el-tooltip :content="uploadTooltip" :disabled="!uploadDisabled" placement="top">
        <span>
          <el-button round type="primary" size="small" class="btn btn-upload" :disabled="uploadDisabled">
            <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
            {{ $t('kling.button.uploadReferences') }}
          </el-button>
        </span>
      </el-tooltip>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, ElTooltip, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform, pasteUploadMixin, uploadTrackerMixin } from '@/utils';
import { getKlingCapabilities } from '@/utils/kling/capabilities';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'EndImage',
  components: {
    ElUpload,
    ElButton,
    ElTooltip,
    ImagePreview,
    InfoIcon,
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
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    reachedLimit(): boolean {
      return (this.fileList?.length || 0) >= 1;
    },
    klingConfig(): Record<string, any> {
      return this.$store.state?.kling?.config || {};
    },
    endImageSupported(): boolean {
      return getKlingCapabilities(this.klingConfig.model, this.klingConfig.mode, this.klingConfig.duration).endImage;
    },
    hasStartImage(): boolean {
      return Boolean(this.klingConfig.start_image_url);
    },
    uploadDisabled(): boolean {
      return this.reachedLimit || !this.endImageSupported || !this.hasStartImage;
    },
    uploadTooltip(): string {
      if (!this.endImageSupported) return this.$t('kling.message.endImageNotSupported');
      if (!this.hasStartImage) return this.$t('kling.message.endImageRequiresStart');
      if (this.reachedLimit) return this.$t('kling.message.uploadReferencesExceed');
      return '';
    },
    storeValue(): string | undefined {
      return this.klingConfig.end_image_url;
    },
    value: {
      get(): string | undefined {
        return this.storeValue;
      },
      set() {
        // Mutation flows through onSetEndImageUrl/store only.
      }
    }
  },
  watch: {
    storeValue(val: string | undefined) {
      // When the store clears the value (e.g. user confirmed dropping it after
      // switching to an incompatible model), drop the local thumbnail too so
      // the UI stays in sync.
      if (!val && this.fileList.length > 0) {
        this.fileList = [];
      }
    },
    hasStartImage(now: boolean) {
      // End frame is only meaningful when paired with a start frame; if the
      // user removes the start image, drop the end image too.
      if (!now && this.storeValue) {
        this.fileList = [];
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling?.config,
          end_image_url: undefined
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetEndImageUrl();
  },
  methods: {
    onBeforeUpload(): boolean {
      if (!this.endImageSupported) {
        ElMessage.warning(this.$t('kling.message.endImageNotSupported'));
        return false;
      }
      if (!this.hasStartImage) {
        ElMessage.warning(this.$t('kling.message.endImageRequiresStart'));
        return false;
      }
      return true;
    },
    onExceed() {
      ElMessage.warning(this.$t('kling.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.uploadReferencesError'));
    },
    onSetEndImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling?.config,
        end_image_url: url
      });
    },
    async onSuccess() {
      this.onSetEndImageUrl();
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
